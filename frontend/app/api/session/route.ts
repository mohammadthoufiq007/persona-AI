import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { createSessionToken, sessionCookieOptions } from '@/lib/security/session';
import { getAllPublicPersonas } from '@/lib/db';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const turnstileToken = body.turnstileToken ?? 'bypass_dev_token';

    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const valid = await verifyTurnstile(turnstileToken, ip);
    if (!valid) {
      return NextResponse.json({ error: 'invalid turnstile token' }, { status: 400 });
    }

    const sessionId = randomUUID();
    const token = await createSessionToken(sessionId);
    const personas = await getAllPublicPersonas();

    const res = NextResponse.json({
      personas,
      quota: { turnsLeftToday: 300 },
      sessionId,
    });

    const opts = sessionCookieOptions();
    res.cookies.set(opts.name, token, opts);
    return res;
  } catch (err: unknown) {
    console.error('[session] POST failed:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
