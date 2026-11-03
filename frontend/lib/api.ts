// Unified API service for PersonaVoice / Gnani AI Backend
import { TurnEvent } from './types';

// Base URL taken from environment variable, falling back to relative paths (Next.js proxy rewrites)
const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, '');
  }
  return '';
};

export interface SessionResponse {
  personas?: Array<{
    slug: string;
    name: string;
    public_config?: {
      name: string;
      languageLabel: string;
      accentColor: string;
      greetingText: string;
    };
  }>;
  quota?: { turnsLeftToday: number };
  sessionId?: string;
  error?: string;
}

export async function initSession(): Promise<SessionResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/session`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        turnstileToken: 'bypass_dev_token',
      }),
      credentials: 'include', // Ensure session cookies are persisted
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to initialize session (${res.status})`);
    }

    return await res.json();
  } catch (err: unknown) {
    const error = err as Error;
    console.warn('[api] initSession warning:', error.message);
    return {
      error: error.message,
    };
  }
}

export async function* streamTurn(
  formData: FormData,
  signal?: AbortSignal,
): AsyncGenerator<TurnEvent> {
  const base = getBaseUrl();
  const url = `${base}/api/turn`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      body: formData,
      signal,
      credentials: 'include',
    });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'AbortError') {
      return;
    }
    yield { t: 'error', code: 'network_error' };
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: `http_${res.status}` }));
    yield { t: 'error', code: err.code ?? `http_${res.status}`, retryAfter: err.retryAfter };
    return;
  }

  if (!res.body) {
    yield { t: 'error', code: 'no_body' };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let emittedDoneOrError = false;
  let receivedAnyEvent = false;

  try {
    while (true) {
      if (signal?.aborted) {
        return;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as TurnEvent;
          receivedAnyEvent = true;
          if (parsed.t === 'done' || parsed.t === 'error') {
            emittedDoneOrError = true;
          }
          yield parsed;
        } catch {
          // ignore malformed lines
        }
      }
    }

    // Flush any leftover in buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim()) as TurnEvent;
        receivedAnyEvent = true;
        if (parsed.t === 'done' || parsed.t === 'error') {
          emittedDoneOrError = true;
        }
        yield parsed;
      } catch {
        // partial unparseable line
      }
    }

    // Stream closed without 'done' or 'error'
    if (!emittedDoneOrError && !signal?.aborted) {
      if (receivedAnyEvent) {
        // Recovery: synthesizer or LLM finished without explicit done event
        yield { t: 'done' };
      } else {
        yield { t: 'error', code: 'stream_empty' };
      }
    }
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'AbortError') {
      return;
    }
    if (!emittedDoneOrError) {
      yield { t: 'error', code: 'stream_truncated' };
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
}

// User-friendly error messages
export function getFriendlyErrorMessage(code: string): string {
  switch (code) {
    case 'stt_empty':
      return 'No speech was detected. Please check your mic and try speaking again.';
    case 'stt_failed':
      return 'Speech transcription service timed out or had an issue. Please try again or type your message.';
    case 'audio_too_large':
      return 'Voice clip was too long. Please speak shorter commands (under 20 seconds).';
    case 'audio_too_short':
      return 'Voice clip was too short to transcribe. Please hold to speak or try again.';
    case 'invalid_audio_format':
      return 'Audio format error. Only 16kHz mono WAV format is supported.';
    case 'rate_limit':
      return 'Turn rate limit reached. Please wait a moment before trying again.';
    case 'budget_limit':
      return 'Daily budget quota reached for demo keys.';
    case 'network_error':
      return 'Network connection error. Please ensure the backend server is running.';
    case 'disabled':
      return 'Voice system is currently in maintenance mode.';
    case 'auth':
      return 'Session expired. Initializing a fresh session...';
    case 'upstream_failure':
      return 'AI model or synthesis provider is temporarily unavailable. Please retry.';
    case 'stream_empty':
      return 'Server connection closed unexpectedly. Please retry.';
    case 'stream_truncated':
      return 'Connection interrupted mid-stream. Please try again.';
    default:
      return `An unexpected error occurred (${code}). Please try again.`;
  }
}
