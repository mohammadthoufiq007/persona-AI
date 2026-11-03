import 'server-only';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifySession, COOKIE_NAME } from '@/lib/security/session';
import { checkOrigin } from '@/lib/security/origin';
import { checkSessionLimit, checkIpLimit } from '@/lib/security/limits';
import { checkBudget, recordUsage, isKillSwitchOn } from '@/lib/security/budget';
import { callPrismaSTT, streamTimbreTTS } from '@/lib/gnani';
import { embedText } from '@/lib/embed';
import { matchChunks, getPersonaBySlug, getSessionMemories, saveMemory } from '@/lib/db';
import { streamLLMTokens } from '@/lib/llm';
import { normalizeForTts } from '@/lib/tts-normalizer';
import { SentenceSplitter } from '@/lib/sentence-splitter';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TurnSchema = z.object({
  persona: z.string().regex(/^[a-z0-9-]+$/),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'model']),
      content: z.string().max(400),
    })
  ).max(6),
});

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const emit = async (obj: object) => {
    try {
      await writer.write(encoder.encode(JSON.stringify(obj) + '\n'));
    } catch {}
  };

  (async () => {
    try {
      // 1. Kill switch
      if (await isKillSwitchOn()) {
        await emit({ t: 'error', code: 'disabled' });
        return;
      }

      // 2. Origin check
      if (!checkOrigin(req)) {
        await emit({ t: 'error', code: 'origin' });
        return;
      }

      // 3. Session authentication
      const cookieStore = await cookies();
      const token = cookieStore.get(COOKIE_NAME)?.value || cookieStore.get('pv_s')?.value;
      let sessionId = token ? await verifySession(token) : null;

      // Allow fallback session for developer convenience in local dev
      if (!sessionId) {
        if (process.env.NODE_ENV !== 'production') {
          sessionId = 'dev-local-session';
        } else {
          await emit({ t: 'error', code: 'auth' });
          return;
        }
      }

      // 4. Parse & validate body
      const form = await req.formData();
      const personaRaw = form.get('persona') as string;
      const historyRaw = form.get('history') as string;

      let historyParsed: Array<{ role: 'user' | 'assistant' | 'model'; content: string }> = [];
      try {
        if (historyRaw) historyParsed = JSON.parse(historyRaw);
      } catch {}

      const parsed = TurnSchema.safeParse({
        persona: personaRaw,
        history: historyParsed,
      });

      if (!parsed.success) {
        await emit({ t: 'error', code: 'invalid_request' });
        return;
      }

      const { persona: personaSlug, history } = parsed.data;
      const audioBlob = form.get('audio') as Blob | null;
      const textInput = form.get('text') as string | null;

      if (!audioBlob && !textInput) {
        await emit({ t: 'error', code: 'missing_input' });
        return;
      }

      if (audioBlob) {
        if (audioBlob.size < 44) {
          await emit({ t: 'error', code: 'audio_too_short' });
          return;
        }
        if (audioBlob.size > 1_500_000) {
          await emit({ t: 'error', code: 'audio_too_large' });
          return;
        }
        try {
          const headerBuffer = await audioBlob.slice(0, 44).arrayBuffer();
          const view = new DataView(headerBuffer);
          const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
          const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));

          if (riff !== 'RIFF' || wave !== 'WAVE') {
            await emit({ t: 'error', code: 'invalid_audio_format' });
            return;
          }

          const numChannels = view.getUint16(22, true);
          const sampleRate = view.getUint32(24, true);
          const bitsPerSample = view.getUint16(34, true);
          const bytesPerSecond = (sampleRate > 0 && numChannels > 0 && bitsPerSample > 0)
            ? sampleRate * numChannels * (bitsPerSample / 8)
            : 32000;
          const dataSize = Math.max(0, audioBlob.size - 44);
          const durationSec = dataSize / bytesPerSecond;

          if (durationSec > 20.5) {
            await emit({ t: 'error', code: 'audio_too_large' });
            return;
          }
        } catch {
          await emit({ t: 'error', code: 'invalid_audio_format' });
          return;
        }
      }

      if (textInput && textInput.length > 500) {
        await emit({ t: 'error', code: 'text_too_long' });
        return;
      }

      // 5. Rate limiting
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

      const [sessionLimit, ipLimit] = await Promise.all([
        checkSessionLimit(sessionId),
        checkIpLimit(ip),
      ]);

      if (!sessionLimit.allowed || !ipLimit.allowed) {
        const retryAfter = Math.max(sessionLimit.retryAfter ?? 60, ipLimit.retryAfter ?? 60);
        await emit({ t: 'error', code: 'rate_limit', retryAfter });
        return;
      }

      // 6. Global budget check
      const budget = await checkBudget();
      if (!budget.ok) {
        await emit({ t: 'error', code: 'budget_limit' });
        return;
      }

      // 7. Load persona definition
      const persona = await getPersonaBySlug(personaSlug);
      if (!persona) {
        await emit({ t: 'error', code: 'persona_not_found' });
        return;
      }
      const priv = persona.private_config;

      // 8. STT
      const t0 = Date.now();
      let transcript: string;

      if (textInput && textInput.trim()) {
        transcript = textInput.trim();
      } else if (audioBlob) {
        try {
          const { transcript: t } = await callPrismaSTT(
            audioBlob,
            priv.sttLanguage || 'en-IN',
            priv.biasWords ?? [],
            req.signal,
          );
          transcript = t;
        } catch (sttErr: unknown) {
          console.error('[turn] STT failed:', sttErr);
          await emit({ t: 'error', code: 'stt_failed' });
          return;
        }

        if (!transcript || !transcript.trim()) {
          await emit({ t: 'error', code: 'stt_empty' });
          return;
        }
      } else {
        await emit({ t: 'error', code: 'invalid_input' });
        return;
      }

      const sttMs = Date.now() - t0;
      await emit({ t: 'transcript', text: transcript });

      // 9. RAG (embed + match_chunks + memories in parallel)
      const t1 = Date.now();
      const [embedding, memories] = await Promise.all([
        embedText(transcript, 'QUERY'),
        getSessionMemories(sessionId, personaSlug),
      ]);

      const chunks = await matchChunks(embedding, persona.id, priv.retrieval?.top_k ?? 5, transcript);
      const ragMs = Date.now() - t1;

      await emit({
        t: 'sources',
        items: chunks.map(c => ({
          title: c.document_title,
          similarity: Math.round(c.similarity * 100) / 100,
        })),
      });

      // 10. Memory Intent Extraction
      const memoryMatch = transcript.match(/remember that (.+)/i) ||
                          transcript.match(/yaad rakhna (.+)/i) ||
                          transcript.match(/nyabagam vechuko (.+)/i);
      if (memoryMatch && memoryMatch[1]) {
        await saveMemory(sessionId, personaSlug, memoryMatch[1].trim());
      }

      // 11. LLM Token Streaming + Sentence Splitter + Immediate TTS Pipeline
      const t2 = Date.now();
      const splitter = new SentenceSplitter();
      let sentenceIndex = 0;
      let firstLlmMs: number | null = null;
      let ttsMs = 0;
      let fullText = '';

      const defaultVoice = priv.sttLanguage === 'hi-IN' ? 'Rahu' : priv.sttLanguage === 'ta-IN' ? 'Maragatham' : 'Saphire';
      const effectiveVoice = priv.tts?.voice || defaultVoice;
      const effectiveLanguage = priv.tts?.language || priv.sttLanguage || 'en-IN';

      for await (const token of streamLLMTokens(priv, transcript, chunks, memories, history, req.signal)) {
        if (req.signal.aborted) break;

        const sentences = splitter.push(token);
        for (const sentence of sentences) {
          if (firstLlmMs === null) firstLlmMs = Date.now() - t2;

          const normalized = normalizeForTts(sentence);
          if (!normalized.trim() || normalized.length > Number(process.env.MAX_TTS_CHARS ?? 300)) {
            continue;
          }

          fullText += sentence + ' ';
          await emit({ t: 'sentence', i: sentenceIndex, text: sentence });

          // Stream TTS for this sentence immediately
          const ttsT0 = Date.now();
          let seq = 0;
          try {
            for await (const b64 of streamTimbreTTS(
              {
                text: normalized,
                voice: effectiveVoice,
                model: priv.tts?.model || 'timbre-v2.5',
                language: effectiveLanguage,
                speed: priv.tts?.speed ?? 1.0,
              },
              req.signal
            )) {
              if (seq === 0) ttsMs += Date.now() - ttsT0;
              await emit({
                t: 'audio',
                i: sentenceIndex,
                seq: seq++,
                fmt: 'pcm_s16le',
                rate: 24000,
                b64,
              });
            }
          } catch (ttsErr) {
            console.warn('[turn] TTS chunk failed for sentence:', ttsErr);
          }

          sentenceIndex++;
        }
      }

      // Flush any remaining partial sentence
      for (const sentence of splitter.flush()) {
        const normalized = normalizeForTts(sentence);
        if (!normalized.trim()) continue;

        if (firstLlmMs === null) firstLlmMs = Date.now() - t2;
        fullText += sentence + ' ';
        await emit({ t: 'sentence', i: sentenceIndex, text: sentence });

        let seq = 0;
        try {
          for await (const b64 of streamTimbreTTS(
            {
              text: normalized,
              voice: effectiveVoice,
              model: priv.tts?.model || 'timbre-v2.5',
              language: effectiveLanguage,
              speed: priv.tts?.speed ?? 1.0,
            },
            req.signal
          )) {
            await emit({
              t: 'audio',
              i: sentenceIndex,
              seq: seq++,
              fmt: 'pcm_s16le',
              rate: 24000,
              b64,
            });
          }
        } catch (ttsErr) {
          console.warn('[turn] TTS flush failed:', ttsErr);
        }

        sentenceIndex++;
      }

      await emit({
        t: 'timing',
        stt: sttMs,
        rag: ragMs,
        llm: firstLlmMs ?? (Date.now() - t2),
        tts: ttsMs,
      });

      await emit({ t: 'done' });

      await recordUsage({
        sttSeconds: audioBlob ? Math.round(audioBlob.size / 32000) : 0,
        ttsChars: fullText.length,
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error?.name === 'AbortError') return; // barge-in cancellation
      console.error('[turn] Error in stream:', err);
      await emit({ t: 'error', code: 'upstream_failure' });
    } finally {
      try {
        await writer.close();
      } catch {}
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-store, no-transform',
    },
  });
}
