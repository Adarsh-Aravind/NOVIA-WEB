import { useMemo, useState } from 'react';
import { Plus, Trash2, Droplets } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTable } from '../lib/useTable';
import { PageHeader, EmptyState, Loader } from '../components/ui';
import { Modal } from '../components/Modal';
import { calculateCyclePredictions } from '../lib/cycle';
import { PHASE_COLOR, PERIOD_SYMPTOMS } from '../lib/constants';
import { formatDate, toDateInput } from '../lib/format';
import type { PeriodRecord } from '../types';

export function Periods() {
  const { coupleId } = useAuth();
  const { rows: periods, loading, refetch } = useTable<PeriodRecord>('periods', 'couple_id', coupleId, {
    order: { column: 'start_date', ascending: false },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(toDateInput(new Date()));
  const [endDate, setEndDate] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const cycle = useMemo(() => calculateCyclePredictions(periods), [periods]);

  const toggleSymptom = (s: string) =>
    setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const create = async () => {
    if (!startDate || !coupleId) return;
    setBusy(true);
    await supabase.from('periods').insert({
      couple_id: coupleId,
      start_date: startDate,
      end_date: endDate || null,
      symptoms,
      notes: notes.trim() || null,
    });
    setBusy(false);
    setEndDate('');
    setSymptoms([]);
    setNotes('');
    setModalOpen(false);
    refetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this log?')) return;
    await supabase.from('periods').delete().eq('id', id);
    refetch();
  };

  return (
    <div className="fade-up">
      <PageHeader
        title="Cycle Tracker"
        subtitle="Predictions from logged history"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={17} /> Log period
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : (
        <>
          {cycle ? (
            <div className="card pad-lg" style={{ marginBottom: 22 }}>
              <div className="spread" style={{ marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div className="card-title">Current phase</div>
                  <div
                    className="display"
                    style={{ fontSize: 28, color: PHASE_COLOR[cycle.currentPhase], marginTop: 4 }}
                  >
                    {cycle.currentPhase}
                  </div>
                  <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>
                    Day {cycle.cycleDay} of ~{cycle.avgCycleLength}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="card-title">Next period</div>
                  <div className="display" style={{ fontSize: 22, marginTop: 4 }}>
                    {cycle.daysUntilNextPeriod >= 0 ? `in ${cycle.daysUntilNextPeriod}d` : `${Math.abs(cycle.daysUntilNextPeriod)}d late`}
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    {formatDate(cycle.nextPeriodStart.toISOString())}
                  </div>
                </div>
              </div>

              {cycle.isStale && (
                <div className="info-banner" style={{ marginBottom: 14 }}>
                  Predictions are extrapolated from an old log — add a recent entry for accuracy.
                </div>
              )}

              <div className="grid grid-3" style={{ gap: 12 }}>
                <MiniStat label="Ovulation" value={formatDate(cycle.predictedOvulation.toISOString())} />
                <MiniStat
                  label="Fertile window"
                  value={`${formatDate(cycle.fertileWindowStart.toISOString())} – ${formatDate(cycle.fertileWindowEnd.toISOString())}`}
                />
                <MiniStat label="Avg period" value={`${cycle.avgPeriodLength} days`} />
              </div>
              <div className="faint" style={{ fontSize: 12, marginTop: 14 }}>
                Confidence: {cycle.confidence}
              </div>
            </div>
          ) : (
            <div className="card pad-lg" style={{ marginBottom: 22 }}>
              <EmptyState
                icon={<Droplets size={40} />}
                title="No cycle data yet"
                hint="Log a period to start seeing predictions."
              />
            </div>
          )}

          <h2 className="card-title" style={{ marginBottom: 12 }}>
            History
          </h2>
          {periods.length === 0 ? (
            <div className="faint" style={{ fontSize: 14 }}>
              No logs yet.
            </div>
          ) : (
            <div className="grid" style={{ gap: 10 }}>
              {periods.map((p) => (
                <div key={p.id} className="list-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {formatDate(p.start_date)}
                      {p.end_date ? ` – ${formatDate(p.end_date)}` : ''}
                    </div>
                    {p.symptoms.length > 0 && (
                      <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
                        {p.symptoms.join(', ')}
                      </div>
                    )}
                    {p.notes && (
                      <div className="faint" style={{ fontSize: 13, marginTop: 2 }}>
                        {p.notes}
                      </div>
                    )}
                  </div>
                  <button className="icon-btn danger" onClick={() => remove(p.id)} aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log a period" maxWidth={520}>
        <div className="form-grid">
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div>
              <label className="label">Start date</label>
              <input
                className="field"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">End date (optional)</label>
              <input
                className="field"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Symptoms</label>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {PERIOD_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  className={`select-chip ${symptoms.includes(s) ? 'active' : ''}`}
                  onClick={() => toggleSymptom(s)}
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={create} disabled={busy}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="list-row" style={{ display: 'block', padding: '12px 14px' }}>
      <div className="faint" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}
