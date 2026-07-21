import { useState } from 'react';
import { Copy, Check, Heart, LogOut, Unlink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui';
import { MOOD_EMOJI } from '../lib/constants';

export function SettingsPage() {
  const { userId, profile, partnerProfile, updateDisplayName, unpairPartner, signOut } = useAuth();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim() || name.trim() === profile?.display_name) return;
    setBusy(true);
    await updateDisplayName(name.trim());
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const copyId = async () => {
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const unpair = async () => {
    if (!confirm('Unpair from your partner? This unlinks both accounts.')) return;
    await unpairPartner();
  };

  return (
    <div className="fade-up" style={{ maxWidth: 640 }}>
      <PageHeader title="Settings" subtitle="Your profile & pairing" />

      <div className="card pad-lg" style={{ marginBottom: 18 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>
          Display name
        </div>
        <div className="row" style={{ gap: 10 }}>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-primary" onClick={save} disabled={busy || !name.trim()}>
            {saved ? <Check size={16} /> : 'Save'}
          </button>
        </div>
      </div>

      {partnerProfile ? (
        <div className="card pad-lg" style={{ marginBottom: 18 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>
            Paired with
          </div>
          <div className="list-row">
            <span style={{ fontSize: 26 }}>{MOOD_EMOJI[partnerProfile.current_mood] ?? '🙂'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{partnerProfile.display_name}</div>
              <div className="faint" style={{ fontSize: 13 }}>
                Feeling {partnerProfile.current_mood.toLowerCase()}
              </div>
            </div>
            <Heart size={18} color="var(--brick)" fill="var(--brick)" />
          </div>
          <button className="btn btn-danger" style={{ marginTop: 16 }} onClick={unpair}>
            <Unlink size={16} /> Unpair
          </button>
        </div>
      ) : (
        <div className="card pad-lg" style={{ marginBottom: 18 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>
            Your pairing ID
          </div>
          <div className="list-row" style={{ padding: '12px 14px' }}>
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
            <button className="icon-btn" onClick={copyId} aria-label="Copy">
              {copied ? <Check size={16} color="var(--lime)" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}

      <button className="btn btn-ghost" onClick={signOut} style={{ width: '100%' }}>
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );
}
