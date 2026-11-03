'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { PanelLeft, Volume2, Sparkles, X } from 'lucide-react';
import { PromptInput } from '@/components/ui/ai-chat-input';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatPanel } from '@/components/ChatPanel';
import { FloatingNav } from '@/components/FloatingNav';
import { StatusBanner } from '@/components/StatusBanner';
import { AudioPlaybackQueue } from '@/lib/audio-queue';
import { VoiceRecorder } from '@/lib/audio-recorder';
import { initSession, streamTurn, getFriendlyErrorMessage } from '@/lib/api';
import { 
  BotState, 
  ChatMessage, 
  ChatSession, 
  LanguageCode, 
  LanguageOption 
} from '@/lib/types';

// Dynamically import 3D WebGL Canvas Orb to avoid SSR issues
const Orb = dynamic(() => import('@/components/ui/orb').then((mod) => mod.Orb), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-56 h-56 rounded-full bg-indigo-500/10 border border-white/10 animate-pulse flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
      </div>
    </div>
  ),
});

// Dynamically import Interactive Physics DotGrid Background
const DotGrid = dynamic(() => import('@/components/ui/DotGrid').then((mod) => mod.DotGrid), {
  ssr: false,
});

const PERSONA_COLORS: Record<string, [string, string]> = {
  'personal-assistant': ["#CADCFC", "#818CF8"],
  'english-assistant': ["#CADCFC", "#818CF8"],
  'shop-assistant': ["#FDE68A", "#F59E0B"],
  'hindi-assistant': ["#FDE68A", "#F59E0B"],
  'tamil-companion': ["#A7F3D0", "#10B981"],
  'tamil-assistant': ["#A7F3D0", "#10B981"],
};

const LANGUAGES: Record<LanguageCode, LanguageOption> = {
  'en-IN': {
    code: 'en-IN',
    personaSlug: 'english-assistant',
    name: 'Sapphire',
    nativeName: 'English',
    displayName: 'Sapphire · English',
    color: '#818CF8',
    hoverClass: 'hover:border-white/40 hover:text-white hover:bg-white/10 hover:shadow-[0_0_14px_rgba(255,255,255,0.15)]',
    activeClass: 'border-white/50 bg-white/20 text-white shadow-[0_0_16px_rgba(255,255,255,0.25)] font-semibold',
  },
  'hi-IN': {
    code: 'hi-IN',
    personaSlug: 'hindi-assistant',
    name: 'Rahu',
    nativeName: 'हिन्दी',
    displayName: 'Rahu · हिन्दी',
    color: '#F59E0B',
    hoverClass: 'hover:border-amber-400/80 hover:text-amber-200 hover:bg-amber-500/15 hover:shadow-[0_0_14px_rgba(245,158,11,0.35)]',
    activeClass: 'border-amber-500 bg-amber-500/20 text-white shadow-[0_0_16px_rgba(245,158,11,0.4)] font-semibold',
  },
  'ta-IN': {
    code: 'ta-IN',
    personaSlug: 'tamil-assistant',
    name: 'Maragatham',
    nativeName: 'தமிழ்',
    displayName: 'Maragatham · தமிழ்',
    color: '#10B981',
    hoverClass: 'hover:border-emerald-400/80 hover:text-emerald-200 hover:bg-emerald-500/15 hover:shadow-[0_0_14px_rgba(16,185,129,0.35)]',
    activeClass: 'border-emerald-500 bg-emerald-500/20 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)] font-semibold',
  },
};

const STORAGE_LANG_KEY = 'persona_ai_lang';
const STORAGE_SESSIONS_KEY = 'persona_ai_sessions';

export default function VoicebotMainPage() {
  const [botState, setBotState] = useState<BotState>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [activeLang, setActiveLang] = useState<LanguageCode>('en-IN');
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-default',
      title: 'Session 1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      languageCode: 'en-IN' as LanguageCode,
      messages: [],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-default');

  // Sync saved preferences and sessions from localStorage on client mount (prevents SSR hydration mismatch)
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_LANG_KEY) as LanguageCode | null;
      if (savedLang && LANGUAGES[savedLang]) {
        setActiveLang(savedLang);
      }
      const savedSessions = localStorage.getItem(STORAGE_SESSIONS_KEY);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions) as ChatSession[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
        }
      }

      // Check for deep-linking query params (e.g. from FloatingNav on /dashboard)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('chat') === '1') {
          setIsChatPanelOpen(true);
        }
      }
    } catch {}
  }, []);

  // Audio & Animation refs
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const liveRecognitionRef = useRef<any>(null);
  const audioQueueRef = useRef<AudioPlaybackQueue | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputVolumeRef = useRef<number>(0);
  const outputVolumeRef = useRef<number>(0);
  const lastAudioLevelTimeRef = useRef<number>(0);
  const volumeAnimFrameRef = useRef<number | null>(null);
  const lastQueryRef = useRef<{ mode: 'voice' | 'text'; audioBlob?: Blob; text?: string } | null>(null);
  const hasInitSessionRef = useRef<boolean>(false);

  const currentOption = LANGUAGES[activeLang];
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // 1. Initialize session and audio queue
  useEffect(() => {
    // Initialize backend session in background (deduplicated across Strict Mode mounts)
    if (!hasInitSessionRef.current) {
      hasInitSessionRef.current = true;
      initSession();
    }

    // Initialize Web Audio Playback Queue
    const queue = new AudioPlaybackQueue();
    queue.onPlaybackComplete = () => {
      setBotState('idle');
      outputVolumeRef.current = 0;
    };
    audioQueueRef.current = queue;

    return () => {
      queue.stop();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (volumeAnimFrameRef.current) cancelAnimationFrame(volumeAnimFrameRef.current);
    };
  }, []);

  // Sync volume animation for Orb
  useEffect(() => {
    const updateVolumes = () => {
      if (audioQueueRef.current && botState === 'speaking') {
        const vol = audioQueueRef.current.getVolume();
        outputVolumeRef.current = vol;
      }
      volumeAnimFrameRef.current = requestAnimationFrame(updateVolumes);
    };
    volumeAnimFrameRef.current = requestAnimationFrame(updateVolumes);
    return () => {
      if (volumeAnimFrameRef.current) cancelAnimationFrame(volumeAnimFrameRef.current);
    };
  }, [botState]);

  // Persist sessions to localStorage
  const saveSessions = useCallback((updated: ChatSession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
    } catch {}
  }, []);

  const createNewSession = (lang = activeLang) => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      languageCode: lang,
      messages: [],
    };
    setSessions((prev) => {
      const next = [newSession, ...prev];
      try {
        localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setActiveSessionId(newSession.id);
    return newSession;
  };

  const handleClearSessions = () => {
    localStorage.removeItem(STORAGE_SESSIONS_KEY);
    const brandNew = createNewSession(activeLang);
    setSessions([brandNew]);
    setActiveSessionId(brandNew.id);
  };

  const handleDeleteSession = (sessionIdToDelete: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionIdToDelete);
      if (remaining.length === 0) {
        const fresh: ChatSession = {
          id: `session_${Date.now()}`,
          title: 'New Conversation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          languageCode: activeLang,
          messages: [],
        };
        setActiveSessionId(fresh.id);
        try {
          localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify([fresh]));
        } catch {}
        return [fresh];
      }
      if (activeSessionId === sessionIdToDelete) {
        setActiveSessionId(remaining[0].id);
      }
      try {
        localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(remaining));
      } catch {}
      return remaining;
    });
  };

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  const addMessageToActiveSession = useCallback((msg: ChatMessage) => {
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === activeSessionId) {
          const updatedMessages = [...s.messages, msg];
          let title = s.title;
          if ((title === 'New Conversation' || title.startsWith('Chat ')) && msg.role === 'user' && msg.content) {
            title = msg.content.trim().slice(0, 32) + (msg.content.trim().length > 32 ? '…' : '');
          }
          return {
            ...s,
            title,
            updatedAt: new Date().toISOString(),
            messages: updatedMessages,
          };
        }
        return s;
      });
      try {
        localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [activeSessionId]);

  const updateLastAssistantMessage = useCallback((textChunk: string, sources?: { title: string; similarity: number }[], timing?: { stt: number; rag: number; llm: number; tts: number }) => {
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === activeSessionId) {
          const msgs = [...s.messages];
          const lastIdx = msgs.length - 1;
          if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: msgs[lastIdx].content + textChunk,
              sources: sources || msgs[lastIdx].sources,
              timing: timing || msgs[lastIdx].timing,
            };
          }
          return { ...s, messages: msgs };
        }
        return s;
      });
      try {
        localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [activeSessionId]);

  // Language switching (persisted)
  const handleLanguageChange = (lang: LanguageCode) => {
    if (lang === activeLang) return;
    setActiveLang(lang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {}
    // If speaking, listening, or processing, interrupt safely
    stopSpeaking();
    if (recorderRef.current?.active) {
      recorderRef.current.stop().catch(() => {});
      recorderRef.current = null;
    }
    setBotState('idle');
    inputVolumeRef.current = 0;
    outputVolumeRef.current = 0;
  };

  // Barge-in & abort stop helper
  const stopSpeaking = () => {
    if (audioQueueRef.current) {
      audioQueueRef.current.stop();
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setBotState('idle');
    inputVolumeRef.current = 0;
    outputVolumeRef.current = 0;
  };

  // Stop recording & trigger backend turn
  const handleStopListening = async () => {
    if (liveRecognitionRef.current) {
      try {
        liveRecognitionRef.current.stop();
      } catch {}
      liveRecognitionRef.current = null;
    }

    if (!recorderRef.current || !recorderRef.current.active) return;

    setBotState('transcribing');
    inputVolumeRef.current = 0;
    setAudioLevel(0);

    try {
      const { blob, url, durationMs } = await recorderRef.current.stop();
      recorderRef.current = null;

      // Discard accidental clicks / micro-noises under 400ms
      if (durationMs < 400) {
        setBotState('idle');
        return;
      }

      await executeTurn({
        mode: 'voice',
        audioBlob: blob,
        audioUrl: url,
      });
    } catch (err: unknown) {
      const e = err as Error;
      setError(`Audio recording processing failed: ${e.message}`);
      setBotState('idle');
    }
  };

  // Keyboard navigation: Escape key stops listening or speaking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (botState === 'listening') {
          handleStopListening();
        } else if (botState === 'speaking' || botState === 'transcribing' || botState === 'thinking') {
          stopSpeaking();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [botState]);

  // Start voice recording session
  const startListening = async () => {
    // Synchronously awaken AudioContext during user interaction gesture
    audioQueueRef.current?.ensureContextResumed();
    stopSpeaking();
    setError(null);
    setBotState('listening');

    // Live browser speech recognition to immediately mirror spoken words into the chatbar
    try {
      if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          if (liveRecognitionRef.current) {
            try {
              liveRecognitionRef.current.abort();
            } catch {}
            liveRecognitionRef.current = null;
          }

          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = activeLang;
          rec.onresult = (e: any) => {
            let transcript = '';
            for (let i = 0; i < e.results.length; i++) {
              transcript += e.results[i][0].transcript;
            }
            if (transcript.trim()) {
              setChatInputText(transcript);
              setIsChatPanelOpen(true);
            }
          };
          rec.onerror = () => {};
          rec.start();
          liveRecognitionRef.current = rec;
        }
      }
    } catch {}

    try {
      const recorder = new VoiceRecorder({
        silenceMs: 1500, // ~1.5s silence auto-stop
        silenceThreshold: 0.015,
        onAudioLevel: (lvl) => {
          inputVolumeRef.current = lvl;
          const now = performance.now();
          if (now - lastAudioLevelTimeRef.current > 200) {
            lastAudioLevelTimeRef.current = now;
            setAudioLevel(lvl);
          }
        },
        onSilenceTimeout: () => {
          // Auto-stop on 1.5s silence
          handleStopListening();
        },
      });

      recorderRef.current = recorder;
      await recorder.start();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Microphone error. Please allow mic access.');
      setBotState('idle');
    }
  };

  // Turn execution pipeline (handles voice and text turns end-to-end)
  async function executeTurn({
    mode,
    audioBlob,
    audioUrl,
    text,
  }: {
    mode: 'voice' | 'text';
    audioBlob?: Blob;
    audioUrl?: string;
    text?: string;
  }) {
    setError(null);
    lastQueryRef.current = { mode, audioBlob, text };

    // Synchronously awaken AudioContext during interaction gesture
    audioQueueRef.current?.ensureContextResumed();

    // Cancel any previous in-flight turn
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Reset audio replay recorder in playback queue
    if (audioQueueRef.current) {
      audioQueueRef.current.resetRecordedSamples();
    }

    const form = new FormData();
    form.append('persona', currentOption.personaSlug);

    // Provide conversation history (last 4 turns)
    const historyPayload = messages.slice(-4).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    form.append('history', JSON.stringify(historyPayload));

    let userMsgCreated = false;

    if (mode === 'voice' && audioBlob) {
      form.append('audio', audioBlob, 'utterance.wav');
    } else if (text) {
      form.append('text', text);
      // Immediately display typed message in the log
      const userMsg: ChatMessage = {
        id: `msg_u_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'text',
        languageCode: activeLang,
        languageLabel: currentOption.nativeName,
      };
      addMessageToActiveSession(userMsg);
      userMsgCreated = true;
    }

    setBotState(mode === 'voice' ? 'transcribing' : 'thinking');

    let assistantMsgCreated = false;
    let fullReplyText = '';
    let audioChunksCount = 0;

    try {
      for await (const event of streamTurn(form, controller.signal)) {
        if (controller.signal.aborted) {
          setBotState('idle');
          return;
        }

        if (event.t === 'error') {
          const friendly = getFriendlyErrorMessage(event.code);
          setError(friendly);
          if (mode === 'voice' && !userMsgCreated) {
            // Record partial attempt so user transcript/intent is never lost
            addMessageToActiveSession({
              id: `msg_u_${Date.now()}`,
              role: 'user',
              content: '🎤 [Voice Utterance]',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              mode: 'voice',
              languageCode: activeLang,
              languageLabel: currentOption.nativeName,
              audioBlobUrl: audioUrl,
            });
            addMessageToActiveSession({
              id: `msg_err_${Date.now()}`,
              role: 'assistant',
              content: `⚠️ ${friendly}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              mode: 'voice',
              languageCode: activeLang,
              languageLabel: currentOption.nativeName,
            });
          }
          setBotState('idle');
          return;
        }

        if (event.t === 'transcript') {
          // Open the new side panel on the right for chatting with the agent
          setIsChatPanelOpen(true);

          // If voice turn, append user's speech transcript to log
          if (mode === 'voice') {
            const userMsg: ChatMessage = {
              id: `msg_u_${Date.now()}`,
              role: 'user',
              content: event.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              mode: 'voice',
              languageCode: activeLang,
              languageLabel: currentOption.nativeName,
              audioBlobUrl: audioUrl,
            };
            addMessageToActiveSession(userMsg);
            userMsgCreated = true;
          }
          // Transcribed text is now sent to the agent chat, so it disappears from the bottom bar
          setChatInputText('');
          setBotState('thinking');
        }

        if (event.t === 'sources') {
          // Grounding references from RAG knowledge base
        }

        if (event.t === 'sentence') {
          fullReplyText += (fullReplyText ? ' ' : '') + event.text;

          if (!assistantMsgCreated) {
            assistantMsgCreated = true;
            const assistantMsg: ChatMessage = {
              id: `msg_a_${Date.now()}`,
              role: 'assistant',
              content: event.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              mode: 'voice',
              languageCode: activeLang,
              languageLabel: currentOption.nativeName,
            };
            addMessageToActiveSession(assistantMsg);
          } else {
            updateLastAssistantMessage(' ' + event.text);
          }
        }

        if (event.t === 'audio') {
          // Streaming 24kHz PCM chunks from Gnani Timbre TTS
          audioChunksCount++;
          // Cancel any browser speech synthesis to ensure zero audio overlap
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
          if (audioQueueRef.current) {
            audioQueueRef.current.enqueuePcmChunk(event.b64, event.rate || 24000);
            setBotState('speaking');
          }
        }

        if (event.t === 'timing') {
          // Update latency timing
          updateLastAssistantMessage('', undefined, event);
        }

        if (event.t === 'done') {
          // Save synthesized replay URL on assistant message
          const replayUrl = audioQueueRef.current?.getRecordedAudioBlobUrl();
          if (replayUrl) {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === activeSessionId) {
                  const msgs = [...s.messages];
                  const lastIdx = msgs.length - 1;
                  if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
                    msgs[lastIdx] = { ...msgs[lastIdx], audioBlobUrl: replayUrl };
                  }
                  return { ...s, messages: msgs };
                }
                return s;
              })
            );
          }

          // Fallback speech synthesis ONLY if backend TTS had zero audio chunks
          if (audioChunksCount === 0 && fullReplyText && typeof window !== 'undefined' && window.speechSynthesis) {
            try {
              const utter = new SpeechSynthesisUtterance(fullReplyText);
              utter.lang = activeLang;
              utter.onstart = () => setBotState('speaking');
              utter.onend = () => setBotState('idle');
              utter.onerror = () => setBotState('idle');
              window.speechSynthesis.speak(utter);
            } catch {
              setBotState('idle');
            }
          } else if (audioChunksCount === 0) {
            setBotState('idle');
          }
        }
      }

      // If stream finished without audio and without done event, ensure idle
      if (audioChunksCount === 0 && botState !== 'speaking') {
        setBotState('idle');
      }
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name !== 'AbortError') {
        setError(`Turn failed: ${e.message || 'Unknown network error'}`);
      }
      setBotState('idle');
    }
  };

  // Retry last failed action with debounce guard
  const handleRetry = () => {
    if (!lastQueryRef.current || botState === 'transcribing' || botState === 'thinking') return;
    executeTurn(lastQueryRef.current);
  };

  // Orb click interaction
  const handleOrbClick = () => {
    audioQueueRef.current?.ensureContextResumed();
    if (botState === 'speaking') {
      // Barge-in: interrupt speech and start listening
      startListening();
    } else if (botState === 'listening') {
      handleStopListening();
    } else if (botState === 'transcribing' || botState === 'thinking') {
      // Stop in-flight request cleanly
      stopSpeaking();
    } else {
      startListening();
    }
  };

  // Chatbar prompt submit
  const handlePromptSubmit = (
    text: string,
    meta?: { model?: string; effort?: string; attachments?: File[] }
  ) => {
    if (!text.trim() || botState === 'transcribing' || botState === 'thinking') return;
    setChatInputText('');
    setIsChatPanelOpen(true);
    audioQueueRef.current?.ensureContextResumed();
    stopSpeaking();

    // Auto-switch language if user selected a language model from dropdown
    if (meta?.model) {
      if (meta.model.includes('Rahu') || meta.model.includes('Hindi')) {
        handleLanguageChange('hi-IN');
      } else if (meta.model.includes('Maragatham') || meta.model.includes('Tamil')) {
        handleLanguageChange('ta-IN');
      } else if (meta.model.includes('Sapphire') || meta.model.includes('Saphire') || meta.model.includes('English')) {
        handleLanguageChange('en-IN');
      }
    }

    executeTurn({
      mode: 'text',
      text: text.trim(),
    });
  };

  const handleModelChange = (modelName: string) => {
    if (modelName.includes('Rahu') || modelName.includes('Hindi')) {
      handleLanguageChange('hi-IN');
    } else if (modelName.includes('Maragatham') || modelName.includes('Tamil')) {
      handleLanguageChange('ta-IN');
    } else {
      handleLanguageChange('en-IN');
    }
  };

  const currentModelName =
    activeLang === 'hi-IN'
      ? "Rahu (Hindi)"
      : activeLang === 'ta-IN'
      ? "Maragatham (Tamil)"
      : "Sapphire (English)";

  const handleVoiceStateChange = useCallback((isRec: boolean) => {
    if (isRec && botState !== 'listening') {
      startListening();
    } else if (!isRec && botState === 'listening') {
      handleStopListening();
    }
  }, [botState]);

  // Map botState to 3D Orb agentState
  const orbAgentState =
    botState === 'listening'
      ? 'listening'
      : botState === 'thinking' || botState === 'transcribing'
      ? 'thinking'
      : botState === 'speaking'
      ? 'talking'
      : null;

  return (
    <div className="flex h-screen w-full bg-[#05060f] text-white overflow-hidden select-none font-sans relative">
      {/* Left Collapsible History Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        currentLanguage={activeLang}
        onSelectLanguage={handleLanguageChange}
        onClose={() => setIsSidebarOpen(false)}
        onOpenChatPanel={() => {
          setIsChatPanelOpen(true);
          setIsSidebarOpen(false);
        }}
      />

      {/* Main Voicebot Canvas Area - stays static, centered, and fully interactive */}
      <main 
        className="flex-1 h-full flex flex-col justify-between p-3 sm:p-6 lg:p-8 relative overflow-hidden bg-transparent"
      >
        {/* Interactive Physics DotGrid Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
          <DotGrid
            dotSize={4}
            gap={26}
            baseColor="#1d2238"
            activeColor={currentOption.color || "#818cf8"}
            proximity={150}
            shockRadius={260}
            shockStrength={4}
            returnDuration={1.4}
          />
        </div>

        {/* Dynamic Persona Ambient Glow */}
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none opacity-15 transition-colors duration-1000 -z-10"
          style={{ background: currentOption.color }}
        />

        {/* Top Header with Brand on Left and FloatingNav Centered on Exact Same Vertical Baseline */}
        <header className="w-full relative flex items-center justify-between z-30 pt-1 px-1 sm:px-2 min-h-[44px]">
          {/* Left: Sidebar Toggle & Persona AI Logo */}
          <div className="flex items-center gap-3 z-10">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              title={isSidebarOpen ? 'Hide History' : 'View Conversation History'}
              aria-label="Toggle Conversation History"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:text-white transition-all shadow-md cursor-pointer hover:border-white/20"
            >
              <PanelLeft className="w-4 h-4 text-white" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/20 shadow-md flex items-center justify-center bg-black/80">
                <img
                  src="/persona-orb-logo.png"
                  alt="Persona AI Logo"
                  className="w-full h-full object-cover pointer-events-none"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base md:text-lg tracking-tight text-white flex items-center gap-2">
                  Persona AI
                </span>
              </div>
            </div>
          </div>

          {/* Center: FloatingNav aligned directly on the vertical center with the header */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20">
            <FloatingNav isEmbedded />
          </div>

          {/* Right: Agent Chat Trigger button */}
          <div className="flex items-center gap-2 z-10">
            <button
              onClick={() => setIsChatPanelOpen((prev) => !prev)}
              title={isChatPanelOpen ? "Close Agent Chat" : "Open Agent Chat"}
              aria-label="Toggle Agent Chat Side Panel"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all shadow-sm backdrop-blur-md cursor-pointer hover:border-white/20 group"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Agent Chat</span>
            </button>
          </div>
        </header>

        {/* Center Stage: Voice Orb & Status Banner */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 pb-8">
          {/* Status Banner / Accessibility Announcements */}
          <div className="mb-4">
            <StatusBanner
              state={botState}
              audioLevel={audioLevel}
              error={error}
              onRetry={handleRetry}
              onStop={handleStopListening}
              languageLabel={currentOption.displayName}
            />
          </div>

          {/* The Pure Voice Orb (click to speak / interrupt) */}
          <div
            className="pointer-events-auto relative w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] md:w-[330px] md:h-[330px] lg:w-[360px] lg:h-[360px] flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] rounded-full group cursor-pointer"
          >
            <Orb
              colors={PERSONA_COLORS[currentOption.personaSlug] || PERSONA_COLORS['personal-assistant']}
              agentState={orbAgentState}
              volumeMode="manual"
              inputVolumeRef={inputVolumeRef}
              outputVolumeRef={outputVolumeRef}
              seed={activeLang === 'hi-IN' ? 2000 : activeLang === 'ta-IN' ? 3000 : 1000}
              className="w-full h-full pointer-events-none select-none"
            />

            {/* Dedicated full-coverage transparent click & touch overlay */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOrbClick();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOrbClick();
                }
              }}
              aria-label={`Voice Assistant Status: ${botState}. Click or press space to ${
                botState === 'listening' ? 'stop listening' : botState === 'speaking' ? 'interrupt' : 'start listening'
              }.`}
              className="absolute inset-0 z-30 w-full h-full rounded-full cursor-pointer bg-transparent focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/50"
            />
          </div>
        </div>

        {/* Bottom Chatbar & Language Selector */}
        <footer className="w-full max-w-xl lg:max-w-2xl mx-auto z-20 flex flex-col items-center gap-2 pb-2 pointer-events-auto">
          {/* AI Chat Input */}
          <PromptInput
            value={chatInputText}
            onChange={setChatInputText}
            placeholder={`Ask in ${currentOption.nativeName} or tap mic to speak...`}
            models={["Sapphire (English)", "Rahu (Hindi)", "Maragatham (Tamil)"]}
            selectedModel={currentModelName}
            onModelChange={handleModelChange}
            isListening={botState === 'listening'}
            onVoiceClick={handleOrbClick}
            audioLevel={audioLevel}
            onVoiceStateChange={handleVoiceStateChange}
            onSubmit={handlePromptSubmit}
          />

          {/* Language Selector: English, தமிழ் (Tamil), हिन्दी (Hindi) */}
          <div className="flex items-center justify-center gap-2 pt-1" role="radiogroup" aria-label="Select voicebot language">
            {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => {
              const lang = LANGUAGES[code];
              const isActive = activeLang === code;

              return (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => handleLanguageChange(code)}
                  className={`group inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer border backdrop-blur-md ${
                    isActive
                      ? lang.activeClass
                      : `border-white/10 bg-white/[0.04] text-slate-400 ${lang.hoverClass}`
                  }`}
                >
                  <span className="font-medium">{lang.name}</span>
                  <span className="text-[11px] opacity-75 ml-1.5">· {lang.nativeName}</span>
                </button>
              );
            })}
          </div>
        </footer>
      </main>

      {/* Right Agent Chat Side Panel */}
      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => setIsChatPanelOpen(false)}
        activeSession={activeSession}
        currentOption={currentOption}
        onSendMessage={(text) => handlePromptSubmit(text)}
        isThinking={botState === 'thinking'}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewSession={() => createNewSession(activeLang)}
        onDeleteSession={handleDeleteSession}
      />

    </div>
  );
}
