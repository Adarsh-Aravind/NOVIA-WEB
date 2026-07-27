import { useState } from 'react';
import { Plus, Trash2, Pencil, StickyNote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTable } from '../lib/useTable';
import { PageHeader, EmptyState, Loader } from '../components/ui';
import { Modal } from '../components/Modal';
import { NOTE_REACTIONS } from '../lib/constants';
import { timeAgo } from '../lib/format';
import type { SharedNote } from '../lib/types';

export function Notes() {
  const { coupleId, userId, profile, partnerProfile } = useAuth();
  const { rows: notes, loading, refetch } = useTable<SharedNote>('notes', 'couple_id', coupleId, {
    order: { column: 'updated_at', ascending: false },
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SharedNote | null>(null);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  const nameOf = (id: string) =>
    id === userId ? profile?.display_name ?? 'You' : partnerProfile?.display_name ?? 'Partner';

  const openNew = () => {
    setEditing(null);
    setContent('');
    setModalOpen(true);
  };
  const openEdit = (n: SharedNote) => {
    setEditing(n);
    setContent(n.content);
    setModalOpen(true);
  };

  const save = async () => {
    if (!content.trim() || !coupleId || !userId) return;
    setBusy(true);
    if (editing) {
      await supabase
        .from('notes')
        .update({ content: content.trim(), updated_by: userId, updated_at: new Date().toISOString() })
        .eq('id', editing.id);
    } else {
      await supabase.from('notes').insert({
        couple_id: coupleId,
        content: content.trim(),
        created_by: userId,
        updated_by: userId,
      });
    }
    setBusy(false);
    setModalOpen(false);
    refetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await supabase.from('notes').delete().eq('id', id);
    refetch();
  };

  const toggleReaction = async (note: SharedNote, emoji: string) => {
    if (!userId) return;
    const reactions = { ...(note.reactions ?? {}) };
    if (reactions[userId] === emoji) delete reactions[userId];
    else reactions[userId] = emoji;
    await supabase.from('notes').update({ reactions }).eq('id', note.id);
    refetch();
  };

  return (
    <div className="fade-up">
      <PageHeader
        title="Shared Notes"
        subtitle="Little cards you and your partner can both see"
        action={
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={17} /> New note
          </button>
        }
      />

      {loading ? (
        <Loader />
      ) : notes.length === 0 ? (
        <EmptyState
          icon={<StickyNote size={40} />}
          title="No notes yet"
          hint="Leave a sweet message or reminder for your partner."
        />
      ) : (
        <div className="grid grid-auto">
          {notes.map((note) => {
            const counts = new Map<string, number>();
            Object.values(note.reactions ?? {}).forEach((e) =>
              counts.set(e, (counts.get(e) ?? 0) + 1),
            );
            return (
              <div key={note.id} className="card pad" style={{ display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: 15.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', flex: 1 }}>
                  {note.content}
                </p>

                <div className="row" style={{ gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                  {NOTE_REACTIONS.map((emoji) => {
                    const count = counts.get(emoji) ?? 0;
                    const mine = note.reactions?.[userId ?? ''] === emoji;
                    return (
                      <button
                        key={emoji}
                        className={`reaction-chip ${count > 0 ? 'active' : ''} ${mine ? 'mine' : ''}`}
                        onClick={() => toggleReaction(note, emoji)}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="reaction-count">{count}</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="spread" style={{ marginTop: 14 }}>
                  <span className="faint" style={{ fontSize: 12 }}>
                    {nameOf(note.updated_by)} · {timeAgo(note.updated_at)}
                  </span>
                  <div className="row" style={{ gap: 4 }}>
                    <button className="icon-btn" onClick={() => openEdit(note)} aria-label="Edit">
                      <Pencil size={14} />
                    </button>
                    <button className="icon-btn danger" onClick={() => remove(note.id)} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit note' : 'New note'}>
        <div className="form-grid">
          <textarea
            className="field"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something…"
            style={{ minHeight: 130 }}
            autoFocus
          />
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save} disabled={busy || !content.trim()}>
              {editing ? 'Save' : 'Add note'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
