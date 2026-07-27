import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PageHeader, EmptyState, Loader } from '../components/ui';
import { Modal } from '../components/Modal';
import { formatDate, toDateInput } from '../lib/format';
import type { MedicalRecord } from '../lib/types';

/**
 * Health = the couple's shared medical vault. Mirrors the app, which records
 * hospital visits (reason + test results). Both partners can read every record;
 * each person writes and deletes only their own (enforced by RLS).
 */
export function Health() {
  const { userId, profile, partnerProfile } = useAuth();
  const [logs, setLogs] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [visitDate, setVisitDate] = useState(toDateInput(new Date()));
  const [reason, setReason] = useState('');
  const [results, setResults] = useState('');
  const [busy, setBusy] = useState(false);

  const memberIds = useMemo(
    () => [userId, partnerProfile?.id].filter((v): v is string => !!v),
    [userId, partnerProfile?.id],
  );

  const nameOf = (uid: string) =>
    uid === userId ? profile?.display_name ?? 'You' : partnerProfile?.display_name ?? 'Partner';

  const fetchLogs = async () => {
    if (memberIds.length === 0) return;
    const { data, error } = await supabase
      .from('medical_vault')
      .select('*')
      .in('user_id', memberIds)
      .eq('metric_type', 'hospital_visit')
      .order('record_date', { ascending: false });
    if (error) console.error('[medical_vault] fetch', error);
    else setLogs((data ?? []) as MedicalRecord[]);
  };

  useEffect(() => {
    if (memberIds.length === 0) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchLogs().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, partnerProfile?.id]);

  const create = async () => {
    if (!userId || !reason.trim()) return;
    setBusy(true);
    await supabase.from('medical_vault').insert({
      user_id: userId,
      metric_type: 'hospital_visit',
      value_json: { reason: reason.trim(), test_results: results.trim() },
      record_date: new Date(visitDate).toISOString(),
      notes: results.trim() || null,
    });
    setBusy(false);
    setReason('');
    setResults('');
    setVisitDate(toDateInput(new Date()));
    setOpen(false);
    fetchLogs();
  };

  const remove = async (id: string) => {
    await supabase.from('medical_vault').delete().eq('id', id);
    fetchLogs();
  };

  return (
    <div className="fade-up">
      <PageHeader
        title="Health"
        subtitle="Shared hospital visits & medical records"
        action={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={17} /> Log visit
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Stethoscope size={40} />}
          title="No hospital visits logged"
          hint="Record a visit so you both have the history handy."
        />
      ) : (
        <div className="grid" style={{ gap: 10 }}>
          {logs.map((l) => (
            <div key={l.id} className="list-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>
                    {l.value_json?.reason || 'Hospital visit'}
                  </span>
                  <span className="pill" style={{ padding: '2px 8px', fontSize: 11 }}>
                    {nameOf(l.user_id)}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
                  {l.value_json?.test_results || 'No test results added.'}
                </div>
                <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>
                  {formatDate(l.record_date)}
                </div>
              </div>
              {l.user_id === userId && (
                <button className="icon-btn danger" onClick={() => remove(l.id)} aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Log a hospital visit">
        <div className="form-grid">
          <div>
            <label className="label">Date</label>
            <input className="field" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Reason for visit</label>
            <input
              className="field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Routine check-up…"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Test results / doctor notes (optional)</label>
            <textarea className="field" value={results} onChange={(e) => setResults(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={create} disabled={busy || !reason.trim()}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
