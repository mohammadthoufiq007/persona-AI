import 'server-only';

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (process.env.TURNSTILE_BYPASS === 'true' || !process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY.includes('REPLACE_WITH')) {
    return true; // bypassed in development
  }
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('[turnstile] verification failed:', err);
    return false;
  }
}
