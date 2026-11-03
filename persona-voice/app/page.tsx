'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useConversationStore } from '@/store/conversation';
import { VoiceOrb } from '@/components/VoiceOrb';
import { LiveCaptions } from '@/components/LiveCaptions';
import { PersonaDock } from '@/components/PersonaDock';
import { SourcesChip } from '@/components/SourcesChip';
import { QuotaMeter } from '@/components/QuotaMeter';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { TelemetryPill } from '@/components/TelemetryPill';
import { TextBar } from '@/components/TextBar';
import { AudioPlaybackQueue } from '@/lib/client/audio-queue';
import { encodeWav } from '@/lib/client/wav-encoder';
import { startVAD } from '@/lib/client/vad';
import { streamTurn } from '@/lib/client/turn-client';
import { Sparkles, Mic, Volume2 } from 'lucide-react';

export default function VoiceAssistantPage() {
  const {
    state,
    setState,
    activePersona,
    personas,
    setPersona,
    setPersonas,
    setTranscript,
    appendReply,
    clearTurn,
    setSources,
    setLatency,
    setQuotaLeft,
    setErrorMessage,
    startTurn,
    barge,
  } = useConversationStore();

  const [audioLevel, setAudioLevel] = useState(0);
  const audioQueueRef = useRef<AudioPlaybackQueue | null>(null);
  const vadControllerRef = useRef<{ stop: () => void } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Audio Context & Queue
  useEffect(() => {
    const queue = new AudioPlaybackQueue();
    queue.onPlaybackComplete = () => {
      if (useConversationStore.getState().state === 'speaking') {
        setState('idle');
      }
    };
    audioQueueRef.current = queue;

    // RMS level loop for reactive orb animations
    const checkAudioLevel = () => {
      if (queue.analyser) {
        const dataArray = new Uint8Array(queue.analyser.frequencyBinCount);
        queue.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(avg / 128); // 0 to 1
      }
      animFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };
    animFrameRef.current = requestAnimationFrame(checkAudioLevel);

    return () => {
      queue.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [setState]);

  // Handle Full Turn Execution
  const executeTurn = useCallback(
    async (body: FormData) => {
      const abortController = startTurn();
      setState('thinking');

      try {
        for await (const event of streamTurn(body, abortController.signal)) {
          if (event.t === 'transcript') {
            setTranscript(event.text);
          } else if (event.t === 'sources') {
            setSources(event.items);
          } else if (event.t === 'sentence') {
            appendReply((event.i === 0 ? '' : ' ') + event.text);
          } else if (event.t === 'audio') {
            setState('speaking');
            audioQueueRef.current?.enqueuePcmChunk(event.b64, event.rate);
          } else if (event.t === 'timing') {
            setLatency(event);
          } else if (event.t === 'error') {
            setErrorMessage(`Error: ${event.code}`);
            setState('error');
            return;
          } else if (event.t === 'done') {
            // If no audio chunks were received (e.g. text mode or empty audio)
            if (!audioQueueRef.current?.isPlaying) {
              setState('idle');
            }
          }
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name === 'AbortError') return;
        console.error('[page] Turn execution failed:', error);
        setErrorMessage('Failed to connect to assistant service');
        setState('error');
      }
    },
    [startTurn, setState, setTranscript, setSources, appendReply, setLatency, setErrorMessage]
  );

  // Initialize Session on Load
  useEffect(() => {
    async function initSession() {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ turnstileToken: 'bypass_dev_token' }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.personas && data.personas.length > 0) {
            setPersonas(data.personas);
            if (!useConversationStore.getState().activePersona) {
              setPersona(data.personas[0]);
            }
          }
          if (data.quota?.turnsLeftToday) {
            setQuotaLeft(data.quota.turnsLeftToday);
          }
        }
      } catch (e) {
        console.warn('[session] Session init error:', e);
      }
    }
    initSession();
  }, [setPersonas, setPersona, setQuotaLeft]);

  // Initialize VAD for voice detection
  useEffect(() => {
    let active = true;

    async function initVad() {
      const vad = await startVAD({
        onSpeechStart: () => {
          if (!active) return;
          const currentState = useConversationStore.getState().state;
          if (currentState === 'speaking') {
            // Barge-in: interrupt speech immediately
            audioQueueRef.current?.stop();
            barge();
          } else if (currentState === 'idle') {
            clearTurn();
            setState('listening');
          }
        },
        onSpeechEnd: (samples) => {
          if (!active) return;
          const curPersona = useConversationStore.getState().activePersona;
          if (!curPersona) return;

          const wavBlob = encodeWav(samples, 16000);
          const form = new FormData();
          form.append('persona', curPersona.slug);
          form.append('audio', wavBlob, 'mic.wav');
          form.append('history', JSON.stringify([]));

          executeTurn(form);
        },
        onVADMisfire: () => {
          if (useConversationStore.getState().state === 'listening') {
            setState('idle');
          }
        },
      });

      if (active) {
        vadControllerRef.current = vad;
      } else {
        vad.stop();
      }
    }

    initVad();

    return () => {
      active = false;
      vadControllerRef.current?.stop();
    };
  }, [barge, clearTurn, setState, executeTurn]);

  // Handle Manual Orb Click (Tap-to-Speak / Push-to-Talk)
  const handleOrbClick = async () => {
    if (state === 'speaking') {
      // Barge-in: user taps orb to stop speaking
      audioQueueRef.current?.stop();
      barge();
      return;
    }

    if (state === 'listening') {
      // Stop recording manually if media recorder active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setState('idle');
      return;
    }

    if (state === 'idle' || state === 'error') {
      clearTurn();
      setState('listening');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach((track) => track.stop());

          // Decode webm into PCM and encode WAV
          try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const offlineCtx = new AudioCtx();
            const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
            const pcmData = audioBuffer.getChannelData(0);

            // Resample or take 16kHz
            const wavBlob = encodeWav(pcmData, offlineCtx.sampleRate);
            const form = new FormData();
            form.append('persona', activePersona?.slug || 'personal-assistant');
            form.append('audio', wavBlob, 'recording.wav');
            form.append('history', JSON.stringify([]));

            executeTurn(form);
          } catch (err) {
            console.error('[orb] Audio decoding error:', err);
            setState('idle');
          }
        };

        mediaRecorder.start();

        // Automatically stop after 6 seconds if not stopped manually
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 6000);
      } catch (err) {
        console.warn('[orb] Mic access denied or not available:', err);
        setState('idle');
      }
    }
  };

  // Handle Text Submission Fallback
  const handleSendText = (text: string) => {
    if (!activePersona) return;
    audioQueueRef.current?.stop();
    clearTurn();

    const form = new FormData();
    form.append('persona', activePersona.slug);
    form.append('text', text);
    form.append('history', JSON.stringify([]));

    executeTurn(form);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 max-w-5xl mx-auto w-full min-h-screen">
      {/* Top Header Bar */}
      <header className="w-full flex items-center justify-between py-2 border-b border-white/5 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg tracking-tight flex items-center gap-2 text-white">
              PersonaVoice
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Gnani AI
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <QuotaMeter />
          <TelemetryPill />
        </div>
      </header>

      {/* Main Interactive Stage */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto">
        <PrivacyBanner />

        {/* Persona Pill Selector Dock */}
        <div className="mb-6 w-full">
          <PersonaDock />
        </div>

        {/* Central Reactive Voice Orb */}
        <VoiceOrb onOrbClick={handleOrbClick} audioLevel={audioLevel} />

        {/* Live Subtitle Captions + RAG Sources */}
        <LiveCaptions />
        <SourcesChip />
      </div>

      {/* Bottom Text Input & Hints */}
      <footer className="w-full mt-6 flex flex-col items-center gap-3">
        <TextBar onSendText={handleSendText} disabled={state === 'thinking'} />

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-2">
          <span>Gnani Prisma STT (v2.5)</span>
          <span>•</span>
          <span>Gemini RAG (768-d)</span>
          <span>•</span>
          <span>Gnani Timbre TTS</span>
        </div>
      </footer>
    </main>
  );
}
