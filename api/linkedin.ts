import { hasSession, json, sameOrigin } from './_lib/session.js';

// POST /api/linkedin → the n8n "LinkedIn content agent" webhook.
// Signed-in only. The webhook URL and its key live in env vars and never reach the browser.
// n8n's answer goes back unchanged.

const ACTIONS = new Set(['templates', 'history', 'draft', 'image', 'render', 'publish']);
// Vercel caps a function's request and response at 4.5 MB; keep a little room for headers
const MAX_BYTES = 4_400_000;
// n8n gets a bit less than the function's maxDuration (300 s in vercel.json), so we can still answer
const N8N_TIMEOUT_MS = 290_000;

export async function POST(req: Request) {
  if (!hasSession(req)) return json(401, { error: 'signed_out' });
  if (!sameOrigin(req)) return json(403, { error: 'bad_origin' });

  // trim: a pasted value often carries a stray space or new line
  const url = process.env.LINKEDIN_WEBHOOK_URL?.trim();
  const key = process.env.LINKEDIN_WEBHOOK_SECRET?.trim();
  if (!url || !key) return json(500, { error: 'not_configured', message: 'LINKEDIN_WEBHOOK_URL / LINKEDIN_WEBHOOK_SECRET are missing' });

  const body = await req.text();
  let action = '';
  try {
    action = String(JSON.parse(body)?.action ?? '');
  } catch {
    return json(400, { error: 'bad_json' });
  }
  if (!ACTIONS.has(action)) return json(400, { error: 'unknown_action' });

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Agent-Key': key },
      body,
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS),
    });
  } catch (e) {
    const timedOut = (e as Error).name === 'TimeoutError';
    console.error(`[linkedin] ${action}: n8n ${timedOut ? 'timed out' : 'unreachable'}`, (e as Error).message);
    return json(504, { error: timedOut ? 'n8n_timeout' : 'n8n_unreachable' });
  }

  // Header Auth failures (wrong/missing key) and a wrong URL get a clear code; they never show in n8n's executions
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    console.error(`[linkedin] ${action}: n8n answered ${res.status}`);
    return json(502, { error: res.status === 404 ? 'n8n_not_found' : 'n8n_rejected_key', status: res.status });
  }

  const text = await res.text();
  const size = Buffer.byteLength(text);
  if (size > MAX_BYTES) {
    // Vercel would cut this off; say so clearly instead
    return json(502, { error: 'response_too_large', action, bytes: size });
  }
  return new Response(text, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
