import { useEffect, useState, type FormEvent } from 'react';
import LinkedInAgent, { SIGNED_OUT_EVENT } from './LinkedInAgent';
import './app.css';

// ahmad-farag.com/app: private tools behind one password. Not linked anywhere, noindex, not in the sitemap.
// The password is checked by /api/session, which sets a signed httpOnly cookie.

type Auth = 'checking' | 'in' | 'out';

export default function AppPage() {
  const [auth, setAuth] = useState<Auth>('checking');

  useEffect(() => {
    document.title = 'وكيل لينكدإن · أحمد فرج';
    fetch('/api/session', { cache: 'no-store' })
      .then((r) => setAuth(r.ok ? 'in' : 'out'))
      .catch(() => setAuth('out'));
    const out = () => setAuth('out');
    window.addEventListener(SIGNED_OUT_EVENT, out);
    return () => window.removeEventListener(SIGNED_OUT_EVENT, out);
  }, []);

  async function signOut() {
    await fetch('/api/session', { method: 'DELETE' }).catch(() => undefined);
    setAuth('out');
  }

  return (
    <div className="li-app" dir="rtl" lang="ar">
      <header className="app-bar">
        <a className="app-brand" href="/">
          <span className="app-brand-dot" />
          أحمد فرج
        </a>
        {auth === 'in' && (
          <button type="button" className="app-signout" onClick={signOut}>
            تسجيل خروج
          </button>
        )}
      </header>
      <main className="app-main">
        {auth === 'checking' && (
          <div className="app-loading">
            <span className="spinner" />
          </div>
        )}
        {auth === 'out' && <Login onIn={() => setAuth('in')} />}
        {auth === 'in' && <LinkedInAgent />}
      </main>
    </div>
  );
}

function Login({ onIn }: { onIn: () => void }) {
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'wrong' | 'error'>('idle');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password || state === 'busy') return;
    setState('busy');
    try {
      const r = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (r.ok) {
        setPassword('');
        onIn();
      } else {
        setState(r.status === 401 ? 'wrong' : 'error');
      }
    } catch {
      setState('error');
    }
  }

  return (
    <form className="login-card" onSubmit={submit}>
      <span className="login-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </span>
      <h1>مساحتي الخاصة</h1>
      <p>ادخل كلمة المرور عشان تفتح وكيل لينكدإن.</p>
      <label className="login-field">
        <span>كلمة المرور</span>
        <input
          type="password"
          autoComplete="current-password"
          autoFocus
          dir="ltr"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (state === 'wrong' || state === 'error') setState('idle');
          }}
          aria-invalid={state === 'wrong'}
        />
      </label>
      {state === 'wrong' && <p className="login-error">كلمة المرور غلط.</p>}
      {state === 'error' && <p className="login-error">ما قدرنا نتحقق الحين. جرّب بعد شوي.</p>}
      <button className="btn login-btn" disabled={!password || state === 'busy'}>
        {state === 'busy' ? 'يتحقق…' : 'ادخل'}
      </button>
    </form>
  );
}
