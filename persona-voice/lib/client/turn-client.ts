export type TurnEvent =
  | { t: 'transcript'; text: string }
  | { t: 'sources'; items: { title: string; similarity: number }[] }
  | { t: 'sentence'; i: number; text: string }
  | { t: 'audio'; i: number; seq: number; fmt: string; rate: number; b64: string }
  | { t: 'timing'; stt: number; rag: number; llm: number; tts: number }
  | { t: 'done' }
  | { t: 'error'; code: string; retryAfter?: number };

export async function* streamTurn(
  body: FormData,
  signal: AbortSignal,
): AsyncGenerator<TurnEvent> {
  const res = await fetch('/api/turn', {
    method: 'POST',
    body,
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: 'upstream' }));
    yield { t: 'error', code: err.code ?? 'upstream', retryAfter: err.retryAfter };
    return;
  }

  if (!res.body) {
    yield { t: 'error', code: 'no_body' };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as TurnEvent;
          yield parsed;
        } catch {
          // ignore malformed line
        }
      }
    }

    if (buf.trim()) {
      try {
        const parsed = JSON.parse(buf.trim()) as TurnEvent;
        yield parsed;
      } catch {}
    }
  } finally {
    reader.releaseLock();
  }
}
