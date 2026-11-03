import 'server-only';

export interface LimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

// In-memory sliding window fallback for dev/when Upstash is not configured
const sessionTurns = new Map<string, number[]>();
const ipTurns = new Map<string, number[]>();

export async function checkSessionLimit(sessionId: string): Promise<LimitResult> {
  if (process.env.NODE_ENV !== 'production') {
    return { allowed: true, remaining: 100 };
  }
  const maxPerHour = Number(process.env.LIMIT_SESSION_TURNS_HOUR ?? 20);
  const now = Date.now();
  const oneHourAgo = now - 3600 * 1000;

  const timestamps = (sessionTurns.get(sessionId) ?? []).filter(t => t > oneHourAgo);
  if (timestamps.length >= maxPerHour) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + 3600 * 1000 - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  timestamps.push(now);
  sessionTurns.set(sessionId, timestamps);
  return { allowed: true, remaining: maxPerHour - timestamps.length };
}

export async function checkIpLimit(ip: string): Promise<LimitResult> {
  if (process.env.NODE_ENV !== 'production') {
    return { allowed: true, remaining: 100 };
  }
  const maxPerMin = Number(process.env.LIMIT_IP_TURNS_MIN ?? 10);
  const now = Date.now();
  const oneMinAgo = now - 60 * 1000;

  const timestamps = (ipTurns.get(ip) ?? []).filter(t => t > oneMinAgo);
  if (timestamps.length >= maxPerMin) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + 60 * 1000 - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  timestamps.push(now);
  ipTurns.set(ip, timestamps);
  return { allowed: true, remaining: maxPerMin - timestamps.length };
}
