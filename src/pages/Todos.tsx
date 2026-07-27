import { useState } from 'react';
import { Plus, Check, Trash2, ListTodo, Repeat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTable } from '../lib/useTable';
import { PageHeader, EmptyState, Loader, SegmentedControl } from '../components/ui';
import { Modal } from '../components/Modal';
import { formatDateTime, toDateTimeInput } from '../lib/format';
import type { Todo, TodoRecurrence } from '../lib/types';

const RECURRENCES: { key: TodoRecurrence; label: string }[] = [
  { key: 'once', label: 'Once' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

export function Todos() {
  const { coupleId, userId } = useAuth();
  const { rows: todos, loading, refetch } = useTable<Todo>('todos', 'couple_id', coupleId, {
    order: { column: 'due_at', ascending: true },
  });

  const [filter, setFilter] = useState<'active' | 'done'>('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueAt, setDueAt] = useState(toDateTimeInput(new Date(Date.now() + 3600_000)));
  const [recurrence, setRecurrence] = useState<TodoRecurrence>('once');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!title.trim() || !coupleId || !userId) return;
    setBusy(true);
    await supabase.from('todos').insert({
      couple_id: coupleId,
      title: title.trim(),
      notes: notes.trim() || null,
      due_at: new Date(dueAt).toISOString(),
      recurrence,
      is_completed: false,
      created_by: userId,
    });
    setBusy(false);
    setTitle('');
    setNotes('');
    setRecurrence('once');
    setModalOpen(false);
    refetch();
  };

  const toggle = async (t: Todo) => {
    await supabase.from('todos').update({ is_completed: !t.is_completed }).eq('id', t.id);
    refetch();
  };

  const remove = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id);
    refetch();
  };

  const filtered = todos.filter((t) => (filter === 'active' ? !t.is_completed : t.is_completed));

  return (
    <div className="fade-up">
      <PageHeader
        title="Shared To-dos"
        subtitle="Reminders you both keep track of"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={17} /> New
          </button>
        }
      />

      <div style={{ marginBottom: 20 }}>
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'active', label: 'Active' },
            { key: 'done', label: 'Done' },
          ]}
        />
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ListTodo size={40} />}
          title={filter === 'active' ? 'Nothing to do' : 'Nothing completed yet'}
        />
      ) : (
        <div className="grid" style={{ gap: 10 }}>
          {filtered.map((t) => {
            const overdue = !t.is_completed && new Date(t.due_at).getTime() < Date.now();
            return (
              <div key={t.id} className="list-row">
                <button
                  className={`checkbox ${t.is_completed ? 'checked' : ''}`}
                  onClick={() => toggle(t)}
                  aria-label="Toggle complete"
                >
                  {t.is_completed && <Check size={14} strokeWidth={3} />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15.5,
                      fontWeight: 600,
                      textDecoration: t.is_completed ? 'line-through' : 'none',
                      opacity: t.is_completed ? 0.55 : 1,
                    }}
                  >
                    {t.title}
                  </div>
                  {t.notes && (
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      {t.notes}
                    </div>
                  )}
                  <div className="row" style={{ gap: 10, marginTop: 5 }}>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: overdue ? 'var(--danger)' : 'var(--text-muted)',
                      }}
                    >
                      {overdue ? 'Overdue · ' : ''}
                      {formatDateTime(t.due_at)}
                    </span>
                    {t.recurrence !== 'once' && (
                      <span className="pill" style={{ padding: '2px 8px', fontSize: 11 }}>
                        <Repeat size={11} /> {t.recurrence}
                      </span>
                    )}
                  </div>
                </div>
                <button className="icon-btn danger" onClick={() => remove(t.id)} aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New to-do">
        <div className="form-grid">
          <div>
            <label className="label">Title</label>
            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <label className="label">Reminder time</label>
            <input
              className="field"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Repeat</label>
            <SegmentedControl value={recurrence} onChange={setRecurrence} options={RECURRENCES} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={create} disabled={busy || !title.trim()}>
              Add
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
