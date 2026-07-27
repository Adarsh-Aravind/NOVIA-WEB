import { useEffect, useState } from 'react';
import { Plus, MessageSquareWarning, CheckCircle2, RotateCcw, Trash2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTable } from '../lib/useTable';
import { PageHeader, EmptyState, Loader, SegmentedControl } from '../components/ui';
import { Modal } from '../components/Modal';
import { timeAgo } from '../lib/format';
import type { Complaint, ComplaintReply } from '../lib/types';

export function Complaints() {
  const { coupleId, userId, profile, partnerProfile } = useAuth();
  const { rows: complaints, loading, refetch } = useTable<Complaint>('complaints', 'couple_id', coupleId, {
    order: { column: 'created_at', ascending: false },
  });

  const [filter, setFilter] = useState<'open' | 'resolved'>('open');
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<Complaint | null>(null);

  const nameOf = (id: string) =>
    id === userId ? profile?.display_name ?? 'You' : partnerProfile?.display_name ?? 'Partner';

  const create = async () => {
    if (!title.trim() || !coupleId || !userId) return;
    setBusy(true);
    await supabase.from('complaints').insert({
      couple_id: coupleId,
      created_by: userId,
      title: title.trim(),
      body: body.trim(),
    });
    setBusy(false);
    setTitle('');
    setBody('');
    setModalOpen(false);
    refetch();
  };

  const setStatus = async (c: Complaint, status: 'open' | 'resolved') => {
    await supabase
      .from('complaints')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', c.id);
    refetch();
    if (active?.id === c.id) setActive({ ...c, status });
  };

  const remove = async (c: Complaint) => {
    if (!confirm('Delete this complaint and its replies?')) return;
    await supabase.from('complaints').delete().eq('id', c.id);
    setActive(null);
    refetch();
  };

  const filtered = complaints.filter((c) => c.status === filter);

  return (
    <div className="fade-up">
      <PageHeader
        title="Complaint Box"
        subtitle="Raise it, talk it through, resolve it"
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
            { key: 'open', label: 'Open' },
            { key: 'resolved', label: 'Resolved' },
          ]}
        />
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquareWarning size={40} />}
          title={filter === 'open' ? 'No open complaints' : 'Nothing resolved yet'}
          hint={filter === 'open' ? 'All clear — nothing to talk about right now.' : undefined}
        />
      ) : (
        <div className="grid" style={{ gap: 12 }}>
          {filtered.map((c) => (
            <div key={c.id} className="card pad" style={{ cursor: 'pointer' }} onClick={() => setActive(c)}>
              <div className="spread" style={{ gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span
                      className="tag"
                      style={{
                        background: c.status === 'open' ? 'var(--glass-danger)' : 'var(--glass-success)',
                        color: c.status === 'open' ? 'var(--danger-soft)' : 'var(--success-soft)',
                      }}
                    >
                      {c.status}
                    </span>
                    <span className="faint" style={{ fontSize: 12 }}>
                      {nameOf(c.created_by)} · {timeAgo(c.created_at)}
                    </span>
                  </div>
                  <div className="display" style={{ fontSize: 18, marginTop: 8 }}>
                    {c.title}
                  </div>
                  {c.body && (
                    <p className="muted" style={{ fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>
                      {c.body.length > 140 ? c.body.slice(0, 140) + '…' : c.body}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New complaint">
        <div className="form-grid">
          <div>
            <label className="label">Title</label>
            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's bothering you?"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Details (optional)</label>
            <textarea
              className="field"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add context…"
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={create} disabled={busy || !title.trim()}>
              Post
            </button>
          </div>
        </div>
      </Modal>

      {active && (
        <ComplaintThread
          complaint={active}
          onClose={() => setActive(null)}
          nameOf={nameOf}
          onStatus={setStatus}
          onDelete={remove}
        />
      )}
    </div>
  );
}

function ComplaintThread({
  complaint,
  onClose,
  nameOf,
  onStatus,
  onDelete,
}: {
  complaint: Complaint;
  onClose: () => void;
  nameOf: (id: string) => string;
  onStatus: (c: Complaint, s: 'open' | 'resolved') => void;
  onDelete: (c: Complaint) => void;
}) {
  const { coupleId, userId } = useAuth();
  const { rows: replies, refetch } = useTable<ComplaintReply>(
    'complaint_replies',
    'complaint_id',
    complaint.id,
    { order: { column: 'created_at', ascending: true } },
  );
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setText('');
  }, [complaint.id]);

  const send = async () => {
    if (!text.trim() || !coupleId || !userId) return;
    setBusy(true);
    await supabase.from('complaint_replies').insert({
      complaint_id: complaint.id,
      couple_id: coupleId,
      author_id: userId,
      body: text.trim(),
    });
    setBusy(false);
    setText('');
    refetch();
  };

  return (
    <Modal open onClose={onClose} title={complaint.title} maxWidth={560}>
      <div className="row" style={{ gap: 8, marginBottom: 16 }}>
        {complaint.status === 'open' ? (
          <button className="btn btn-ghost btn-sm" onClick={() => onStatus(complaint, 'resolved')}>
            <CheckCircle2 size={15} /> Mark resolved
          </button>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={() => onStatus(complaint, 'open')}>
            <RotateCcw size={15} /> Reopen
          </button>
        )}
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(complaint)}>
          <Trash2 size={15} /> Delete
        </button>
      </div>

      {complaint.body && (
        <div className="list-row" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>
              {nameOf(complaint.created_by)} · {timeAgo(complaint.created_at)}
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{complaint.body}</p>
          </div>
        </div>
      )}

      <div className="stack" style={{ gap: 10, maxHeight: 320, overflowY: 'auto', marginBottom: 14 }}>
        {replies.map((r) => {
          const mine = r.author_id === userId;
          return (
            <div key={r.id} className={`bubble ${mine ? 'mine' : 'theirs'}`}>
              <div className="faint" style={{ fontSize: 11, marginBottom: 3 }}>
                {nameOf(r.author_id)} · {timeAgo(r.created_at)}
              </div>
              <div style={{ fontSize: 14.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{r.body}</div>
            </div>
          );
        })}
        {replies.length === 0 && (
          <div className="faint" style={{ fontSize: 13, textAlign: 'center', padding: '10px 0' }}>
            No replies yet.
          </div>
        )}
      </div>

      <div className="row" style={{ gap: 8 }}>
        <input
          className="field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Write a reply…"
        />
        <button className="btn btn-primary" onClick={send} disabled={busy || !text.trim()}>
          <Send size={16} />
        </button>
      </div>
    </Modal>
  );
}
