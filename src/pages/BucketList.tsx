import { useState } from 'react';
import { Plus, Trash2, Target, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTable } from '../lib/useTable';
import { PageHeader, EmptyState, Loader, SegmentedControl } from '../components/ui';
import { Modal } from '../components/Modal';
import { BUCKET_CATEGORIES } from '../lib/constants';
import type { BucketListItem } from '../types';

type Cat = BucketListItem['category'];

export function BucketList() {
  const { coupleId, userId } = useAuth();
  const { rows, loading, refetch } = useTable<BucketListItem>('bucket_list', 'couple_id', coupleId, {
    order: { column: 'created_at', ascending: false },
  });

  const [tab, setTab] = useState<Cat | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState<Cat>('traveling');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!title.trim() || !coupleId || !userId) return;
    setBusy(true);
    await supabase.from('bucket_list').insert({
      couple_id: coupleId,
      category,
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

  const toggle = async (item: BucketListItem) => {
    const done = !item.is_completed;
    await supabase
      .from('bucket_list')
      .update({
        is_completed: done,
        completed_at: done ? new Date().toISOString() : null,
        completed_by: done ? userId : null,
      })
      .eq('id', item.id);
    refetch();
  };

  const remove = async (id: string) => {
    await supabase.from('bucket_list').delete().eq('id', id);
    refetch();
  };

  const items = tab === 'all' ? rows : rows.filter((r) => r.category === tab);
  const emojiOf = (c: string) => BUCKET_CATEGORIES.find((x) => x.key === c)?.emoji ?? '⭐';
  const doneCount = rows.filter((r) => r.is_completed).length;

  return (
    <div className="fade-up">
      <PageHeader
        title="Bucket List"
        subtitle={`${doneCount} of ${rows.length} done together`}
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={17} /> Add dream
          </button>
        }
      />

      <div style={{ marginBottom: 22 }}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { key: 'all', label: 'All' },
            ...BUCKET_CATEGORIES.map((c) => ({ key: c.key, label: `${c.emoji} ${c.label}` })),
          ]}
        />
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon={<Target size={40} />} title="No dreams here yet" hint="Add something you both want to do." />
      ) : (
        <div className="grid grid-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="card pad"
              style={{ opacity: item.is_completed ? 0.7 : 1 }}
            >
              <div className="spread" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontSize: 26 }}>{emojiOf(item.category)}</span>
                <button className="icon-btn danger" onClick={() => remove(item.id)} aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
              <div
                className="display"
                style={{
                  fontSize: 17,
                  marginTop: 10,
                  textDecoration: item.is_completed ? 'line-through' : 'none',
                }}
              >
                {item.title}
              </div>
              {item.description && (
                <p className="muted" style={{ fontSize: 13.5, marginTop: 5, lineHeight: 1.5 }}>
                  {item.description}
                </p>
              )}
              <button
                className={`btn btn-sm ${item.is_completed ? 'btn-primary' : 'btn-ghost'}`}
                style={{ marginTop: 14, width: '100%' }}
                onClick={() => toggle(item)}
              >
                <Check size={14} /> {item.is_completed ? 'Completed' : 'Mark done'}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add to bucket list">
        <div className="form-grid">
          <div>
            <label className="label">Category</label>
            <SegmentedControl
              value={category}
              onChange={setCategory}
              options={BUCKET_CATEGORIES.map((c) => ({ key: c.key, label: `${c.emoji} ${c.label}` }))}
            />
          </div>
          <div>
            <label className="label">Title</label>
            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="See the northern lights…"
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
