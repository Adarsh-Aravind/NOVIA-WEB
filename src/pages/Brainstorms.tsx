import { useState } from 'react';
import { Plus, Trash2, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTable } from '../lib/useTable';
import { PageHeader, EmptyState, Loader, SegmentedControl } from '../components/ui';
import { Modal } from '../components/Modal';
import { timeAgo } from '../lib/format';
import { BRAINSTORM_CATEGORIES } from '../lib/constants';
import type { Brainstorm } from '../types';

type Cat = Brainstorm['category'];

export function Brainstorms() {
  const { coupleId, userId } = useAuth();
  const { rows, loading, refetch } = useTable<Brainstorm>('brainstorms', 'couple_id', coupleId, {
    order: { column: 'created_at', ascending: false },
  });

  const [tab, setTab] = useState<Cat>('date_ideas');
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!title.trim() || !coupleId || !userId) return;
    setBusy(true);
    await supabase.from('brainstorms').insert({
      couple_id: coupleId,
      category: tab,
      title: title.trim(),
      description: description.trim() || null,
      created_by: userId,
    });
    setBusy(false);
    setTitle('');
    setDescription('');
    setModalOpen(false);
    refetch();
  };

  const remove = async (id: string) => {
    await supabase.from('brainstorms').delete().eq('id', id);
    refetch();
  };

  const items = rows.filter((r) => r.category === tab);
  const meta = BRAINSTORM_CATEGORIES.find((c) => c.key === tab)!;

  return (
    <div className="fade-up">
      <PageHeader
        title="Ideas & Brainstorms"
        subtitle="Capture sparks before they fade"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={17} /> New idea
          </button>
        }
      />

      <div style={{ marginBottom: 22 }}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={BRAINSTORM_CATEGORIES.map((c) => ({ key: c.key, label: `${c.emoji} ${c.label}` }))}
        />
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon={<Lightbulb size={40} />} title={`No ${meta.label.toLowerCase()} ideas yet`} />
      ) : (
        <div className="grid grid-auto">
          {items.map((it) => (
            <div key={it.id} className="card pad">
              <div className="spread" style={{ alignItems: 'flex-start', gap: 8 }}>
                <div className="display" style={{ fontSize: 17 }}>
                  {it.title}
                </div>
                <button className="icon-btn danger" onClick={() => remove(it.id)} aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
              {it.description && (
                <p className="muted" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.55 }}>
                  {it.description}
                </p>
              )}
              <div className="faint" style={{ fontSize: 12, marginTop: 12 }}>
                {timeAgo(it.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`New ${meta.label} idea`}>
        <div className="form-grid">
          <div>
            <label className="label">Title</label>
            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Idea"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
