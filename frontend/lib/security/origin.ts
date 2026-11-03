import 'server-only';

export function checkOrigin(req: Request): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true; // relaxed origin in local dev
  }
  const allowed = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const origin = req.headers.get('origin')?.toLowerCase() ?? '';
  const host = req.headers.get('host')?.toLowerCase() ?? '';

  if (!origin) {
    // If same-site navigation or direct API from browser page
    return true;
  }

  if (allowed.includes(origin)) return true;

  try {
    const originUrl = new URL(origin);
    if (originUrl.host === host) return true;
  } catch {}

  return false;
}
