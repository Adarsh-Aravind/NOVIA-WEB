import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'in') {
        const err = await signIn(email.trim(), password);
        if (err) setError(err);
      } else {
        if (!displayName.trim()) {
          setError('Please enter a display name.');
          return;
        }
        const err = await signUp(email.trim(), password, displayName.trim());
        if (err) setError(err);
        else {
          setInfo('Account created. You can sign in now.');
          setMode('in');
          setPassword('');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card fade-up">
        <img className="auth-logo" src="/novia-icon.png" alt="NOVIA" />
        <h1 className="display" style={{ textAlign: 'center', fontSize: 26, letterSpacing: '0.06em' }}>
          NOVIA
        </h1>
        <p className="muted" style={{ textAlign: 'center', marginTop: 4, marginBottom: 26, fontSize: 14 }}>
          {mode === 'in' ? 'Welcome back' : 'Create your account'}
        </p>

        <form className="form-grid" onSubmit={submit}>
          {mode === 'up' && (
            <div>
              <label className="label">Display name</label>
              <input
                className="field"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {error && <div className="error-banner">{error}</div>}
          {info && <div className="info-banner">{info}</div>}

          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }} className="muted">
          {mode === 'in' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            className="link-btn"
            onClick={() => {
              setMode(mode === 'in' ? 'up' : 'in');
              setError(null);
              setInfo(null);
            }}
          >
            {mode === 'in' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
