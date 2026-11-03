import 'server-only';

const BASE = 'https://api.vachana.ai';

class AsyncMutex {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(signal?: AbortSignal): Promise<() => void> {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    if (!this.locked) {
      this.locked = true;
      return () => this.release();
    }

    return new Promise<() => void>((resolve, reject) => {
      const onAbort = () => {
        const idx = this.queue.indexOf(entry);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
        }
        reject(new DOMException('Aborted', 'AbortError'));
      };

      const entry = () => {
        if (signal?.aborted) {
          signal.removeEventListener('abort', onAbort);
          this.release();
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        signal?.removeEventListener('abort', onAbort);
        resolve(() => this.release());
      };

      signal?.addEventListener('abort', onAbort);
      this.queue.push(entry);
    });
  }

  private release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
}

const gnaniMutex = new AsyncMutex();

async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}

export async function callPrismaSTT(
  wavBlob: Blob,
  languageCode: string,
  biasWords: string[] = [],
  signal?: AbortSignal,
): Promise<{ transcript: string; latency_ms: number }> {
  const apiKey = process.env.GNANI_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE_WITH')) {
    console.warn('[gnani] No GNANI_API_KEY provided — mock transcript');
    return { transcript: 'Tell me about the PersonaVoice project.', latency_ms: 120 };
  }

  const release = await gnaniMutex.acquire(signal);
  const t0 = Date.now();

  try {
    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const form = new FormData();
      form.append('audio_file', wavBlob, 'utterance.wav');
      form.append('language_code', languageCode);
      form.append('format', 'verbatim');

      if (biasWords.length) {
        form.append('bias_list', JSON.stringify(biasWords));
        form.append('bias_score', '1.5');
      }

      try {
        const res = await fetch(`${BASE}/stt/v3`, {
          method: 'POST',
          headers: { 'X-API-Key-ID': apiKey },
          body: form,
          signal,
        });

        if (!res.ok) {
          const status = res.status;
          const errorText = await res.text().catch(() => '');

          if ((status === 429 || status === 504) && attempt < maxRetries) {
            attempt++;
            const backoffMs = attempt * 400 + Math.floor(Math.random() * 200);
            console.warn(`[gnani] STT received ${status}, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})...`);
            await delay(backoffMs, signal);
            continue;
          }

          throw new Error(`Prisma STT failed (${status}): ${errorText}`);
        }

        const json = await res.json();
        const transcript = json.transcript ?? json.text ?? json.data?.transcript ?? '';
        return { transcript, latency_ms: Date.now() - t0 };
      } catch (err: unknown) {
        const error = err as Error;
        if (error?.name === 'AbortError') throw error;
        if (attempt < maxRetries && (error?.message?.includes('429') || error?.message?.includes('504'))) {
          attempt++;
          const backoffMs = attempt * 400 + Math.floor(Math.random() * 200);
          console.warn(`[gnani] STT fetch error, retrying in ${backoffMs}ms...`, error.message);
          await delay(backoffMs, signal);
          continue;
        }
        throw error;
      }
    }

    throw new Error('Prisma STT failed: max retries exceeded');
  } finally {
    release();
  }
}

export const GNANI_VOICE_MAP: Record<string, string> = {
  maragatham: 'Kaveri',
  rahu: 'Poorvi',
  saphire: 'Kaveri',
  sapphire: 'Kaveri',
  aria: 'Kaveri',
};

export function resolveGnaniVoice(voice: string, language: string): string {
  const normalized = (voice || '').trim().toLowerCase();
  if (GNANI_VOICE_MAP[normalized]) return GNANI_VOICE_MAP[normalized];
  if (voice && !['maragatham', 'rahu', 'saphire', 'sapphire', 'aria'].includes(normalized)) {
    return voice;
  }
  if (language === 'ta-IN') return 'Kaveri';
  if (language === 'hi-IN') return 'Poorvi';
  return 'Kaveri';
}

export interface TimbreTTSParams {
  text: string;
  voice: string;
  model: string;
  language: string;
  speed?: number;
  format?: 'raw' | 'mp3';
}

export async function* streamTimbreTTS(
  params: TimbreTTSParams,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const apiKey = process.env.GNANI_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE_WITH')) {
    console.warn('[gnani] No GNANI_API_KEY provided for TTS — skipping stream');
    return;
  }

  const release = await gnaniMutex.acquire(signal);

  try {
    const format = params.format ?? (process.env.TTS_FORMAT ?? 'raw');
    const audioConfig = format === 'raw'
      ? { encoding: 'linear_pcm', sample_rate: 24000, num_channels: 1, sample_width: 2, container: 'raw' }
      : { encoding: 'mp3', sample_rate: 24000, num_channels: 1, container: 'mp3' };

    const targetVoice = resolveGnaniVoice(params.voice, params.language);
    const maxRetries = 2;
    let attempt = 0;
    let res: Response | null = null;

    while (attempt <= maxRetries) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      try {
        res = await fetch(`${BASE}/api/v1/tts/sse`, {
          method: 'POST',
          headers: {
            'X-API-Key-ID': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: params.text,
            voice: targetVoice,
            model: params.model || 'timbre-v2.5',
            language: params.language,
            speed: params.speed ?? 1.0,
            audio_config: audioConfig,
          }),
          signal,
        });

        if (!res.ok) {
          const status = res.status;
          const errText = await res.text().catch(() => '');

          if ((status === 429 || status === 504) && attempt < maxRetries) {
            attempt++;
            const backoffMs = attempt * 400 + Math.floor(Math.random() * 200);
            console.warn(`[gnani] TTS received ${status}, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})...`);
            await delay(backoffMs, signal);
            continue;
          }

          throw new Error(`Timbre TTS failed (${status}): ${errText}`);
        }

        break;
      } catch (err: unknown) {
        const error = err as Error;
        if (error?.name === 'AbortError') throw error;
        if (attempt < maxRetries && (error?.message?.includes('429') || error?.message?.includes('504'))) {
          attempt++;
          const backoffMs = attempt * 400 + Math.floor(Math.random() * 200);
          console.warn(`[gnani] TTS fetch error, retrying in ${backoffMs}ms...`, error.message);
          await delay(backoffMs, signal);
          continue;
        }
        throw error;
      }
    }

    if (!res || !res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    try {
      while (true) {
        if (signal?.aborted) break;

        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const rawJson = trimmed.slice(5).trim();
          if (!rawJson) continue;

          try {
            const payload = JSON.parse(rawJson);
            const audioData = payload.audio || (payload.event === 'chunk' ? payload.data : undefined) || payload.data;
            if (typeof audioData === 'string' && audioData.length > 0) {
              yield audioData;
            }
          } catch {
            // ignore malformed SSE line
          }
        }
      }
    } finally {
      try {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      } catch {}
    }
  } finally {
    release();
  }
}
