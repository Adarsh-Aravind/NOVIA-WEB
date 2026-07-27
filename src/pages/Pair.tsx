import { useState } from 'react';
import { Copy, Check, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Pair() {
  const { userId, profile, pairPartner, signOut } = useAuth();
  const [partnerId, setPartnerId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!partnerId.trim()) return;
    setBusy(true);
    const err = await pairPartner(partnerId.trim());
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card fade-up" style={{ maxWidth: 460 }}>
        <img className="auth-logo" src="/novia-icon.png" alt="NOVIA" />
        <h1 className="display" style={{ textAlign: 'center', fontSize: 24 }}>
          Pair with your partner
        </h1>
        <p className="muted" style={{ textAlign: 'center', marginTop: 6, marginBottom: 24, fontSize: 14 }}>
          Hi {profile?.display_name}. Share your ID with your partner, then paste theirs to link your
          accounts.
        </p>

        <label className="label">Your pairing ID</label>
        <div className="list-row" style={{ marginBottom: 20, padding: '12px 14px' }}>
          <code
            style={{
              flex: 1,
              fontSize: 12.5,
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              color: 'var(--text-muted)',
            }}
          >
            {userId}
          </code>
          <button className="icon-btn" onClick={copyId} aria-label="Copy ID">
            {copied ? <Check size={16} color="var(--primary)" /> : <Copy size={16} />}
          </button>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <div>
            <label className="label">Partner's pairing ID</label>
            <input
              className="field"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              placeholder="Paste your partner's ID"
            />
          </div>
          {error && <div className="error-banner">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Linking…' : 'Link accounts'}
          </button>
        </form>

        <button className="btn btn-ghost" onClick={signOut} style={{ width: '100%', marginTop: 14 }}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}
