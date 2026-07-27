import { useMemo, useState } from 'react';
import { Plus, Trash2, CalendarHeart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTable } from '../lib/useTable';
import { PageHeader, EmptyState, Loader, SegmentedControl } from '../components/ui';
import { Modal } from '../components/Modal';
import { MILESTONE_EMOJIS } from '../lib/constants';
import {
  daysUntilNext,
  nextOccurrence,
  elapsedAt,
  formatElapsed,
  MILESTONE_RECURRENCES,
} from '../lib/milestones';
import { formatDate, toDateInput } from '../lib/format';
import type { Milestone, MilestoneRecurrence } from '../types';

function countdownLabel(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export function Milestones() {
  const { coupleId, userId } = useAuth();
  const { rows, loading, refetch } = useTable<Milestone>('milestones', 'couple_id', coupleId, {
    order: { column: 'milestone_date', ascending: true },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [recurrence, setRecurrence] = useState<MilestoneRecurrence>('yearly');
  const [emoji, setEmoji] = useState<string>(MILESTONE_EMOJIS[0]);
  const [busy, setBusy] = useState(false);

  // Upcoming first: soonest next occurrence, one-offs already passed sink to the end.
  const sorted = useMemo(() => {
    const now = new Date();
    return [...rows]
      .map((m) => ({ m, days: daysUntilNext(m, now) }))
      .sort((a, b) => {
        if (a.days === null) return 1;
        if (b.days === null) return -1;
        return a.days - b.days;
      });
  }, [rows]);

  const create = async () => {
    if (!title.trim() || !date || !coupleId || !userId) return;
    setBusy(true);
    await supabase.from('milestones').insert({
      couple_id: coupleId,
      title: title.trim(),
      milestone_date: date,
      recurrence,
      emoji: emoji || null,
      created_by: userId,
    });
    setBusy(false);
    setTitle('');
    setDate('');
    setRecurrence('yearly');
    setEmoji(MILESTONE_EMOJIS[0]);
    setModalOpen(false);
    refetch();
  };

  const remove = async (id: string) => {
    await supabase.from('milestones').delete().eq('id', id);
    refetch();
  };

  return (
    <div className="fade-up">
      <PageHeader
        title="Milestones"
        subtitle="The days worth remembering, together"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={17} /> Add milestone
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<CalendarHeart size={40} />}
          title="No milestones yet"
          hint="Add your first date, an anniversary, or a day you never want to forget."
        />
      ) : (
        <div className="grid grid-auto">
          {sorted.map(({ m, days }) => {
            const next = nextOccurrence(m);
            const elapsed = next ? elapsedAt(m, next) : null;
            const elapsedText = elapsed ? formatElapsed(elapsed.count, elapsed.unit) : '';
            const isToday = days === 0;
            return (
              <div
                key={m.id}
                className="card pad"
                style={isToday ? { borderColor: 'var(--lime)' } : undefined}
              >
                <div className="spread" style={{ alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 26 }}>{m.emoji ?? '💛'}</span>
                  <button className="icon-btn danger" onClick={() => remove(m.id)} aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="display" style={{ fontSize: 17, marginTop: 10 }}>
                  {m.title}
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {formatDate(m.milestone_date)}
                  {m.recurrence !== 'once' && ` · ${m.recurrence}`}
                </div>
                <div className="spread" style={{ marginTop: 14, alignItems: 'center' }}>
                  <span
                    className="pill"
                    style={
                      isToday
                        ? { background: 'var(--lime)', color: 'var(--forest-deep, #14261a)' }
                        : undefined
                    }
                  >
                    {days === null ? 'Passed' : countdownLabel(days)}
                  </span>
                  {elapsedText && (
                    <span className="faint" style={{ fontSize: 12.5 }}>
                      {elapsedText}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add a milestone">
        <div className="form-grid">
          <div>
            <label className="label">Title</label>
            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Our first date…"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              className="field"
              type="date"
              value={date}
              max={toDateInput(new Date())}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Repeats</label>
            <SegmentedControl
              value={recurrence}
              onChange={setRecurrence}
              options={MILESTONE_RECURRENCES}
            />
          </div>
          <div>
            <label className="label">Emoji</label>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {MILESTONE_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`icon-btn ${emoji === e ? 'active' : ''}`}
                  style={{
                    width: 42,
                    height: 42,
                    fontSize: 20,
                    outline: emoji === e ? '2px solid var(--lime)' : 'none',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={create}
              disabled={busy || !title.trim() || !date}
            >
              Add
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
