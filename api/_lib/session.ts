import { createHmac, timingSafeEqual } from 'node:crypto';

// The /app session: one password (APP_PASSWORD) → a signed, httpOnly cookie (APP_SESSION_SECRET).
// Cookie value: "<expiry ms>.<HMAC-SHA256 of 'app:<expiry ms>'>". No accounts, nothing stored server-side.
// Changing APP_SESSION_SECRET signs everyone out.

export const COOKIE = 'af_app';
const MAX_AGE_S = 30 * 24 * 60 * 60; // 30 days

const sign = (exp: string, secret: string) => createHmac('sha256', secret).update(`app:${exp}`).digest('base64url');

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function readCookie(req: Request, name: string) {
  for (const part of (req.headers.get('cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

// true when the request carries a valid, unexpired session cookie
export function hasSession(req: Request) {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) return false;
  const [exp, mac] = readCookie(req, COOKIE).split('.');
  if (!exp || !mac || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return safeEqual(mac, sign(exp, secret));
}

export function passwordMatches(input: string) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  // compare hashes so the length of the real password doesn't leak
  const h = (s: string) => createHmac('sha256', 'app-password').update(s).digest('base64url');
  return safeEqual(h(input), h(expected));
}

const secure = (req: Request) => new URL(req.url).protocol === 'https:' || process.env.VERCEL === '1';

export function sessionCookie(req: Request) {
  const secret = process.env.APP_SESSION_SECRET!;
  const exp = String(Date.now() + MAX_AGE_S * 1000);
  return `${COOKIE}=${exp}.${sign(exp, secret)}; Path=/; Max-Age=${MAX_AGE_S}; HttpOnly; SameSite=Strict${secure(req) ? '; Secure' : ''}`;
}

export function clearCookie(req: Request) {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${secure(req) ? '; Secure' : ''}`;
}

// Blocks cross-site POSTs: the browser always sends Origin on a cross-origin POST
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function json(status: number, data: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...headers },
  });
}
