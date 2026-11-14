import { clearCookie, hasSession, json, passwordMatches, sameOrigin, sessionCookie } from './_lib/session.js';

// GET    /api/session  → 200 when signed in, 401 otherwise (the /app page asks this on load)
// POST   /api/session  {password} → sets the session cookie
// DELETE /api/session  → signs out

export function GET(req: Request) {
  return hasSession(req) ? json(200, { ok: true }) : json(401, { ok: false });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json(403, { error: 'bad_origin' });
  if (!process.env.APP_PASSWORD || !process.env.APP_SESSION_SECRET) return json(500, { error: 'not_configured' });
  let password = '';
  try {
    password = String((await req.json())?.password ?? '');
  } catch {
    /* empty or bad body → wrong password */
  }
  if (!password || !passwordMatches(password)) {
    // slow down guessing a little
    await new Promise((r) => setTimeout(r, 800));
    return json(401, { error: 'wrong_password' });
  }
  return json(200, { ok: true }, { 'Set-Cookie': sessionCookie(req) });
}

export function DELETE(req: Request) {
  if (!sameOrigin(req)) return json(403, { error: 'bad_origin' });
  return json(200, { ok: true }, { 'Set-Cookie': clearCookie(req) });
}
