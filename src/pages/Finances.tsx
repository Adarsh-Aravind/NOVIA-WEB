import { useMemo, useState } from 'react';
import { Plus, Trash2, Wallet, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTable } from '../lib/useTable';
import { PageHeader, EmptyState, Loader, SegmentedControl } from '../components/ui';
import { Modal } from '../components/Modal';
import { currency, formatDate, toDateInput } from '../lib/format';
import {
  summarizeFinances,
  isRecurring,
  isOverdue,
  nextDueDate,
  parseLocalDate,
  toLocalISODate,
} from '../lib/finance';
import type { FinanceItem } from '../types';

export function Finances() {
  const { coupleId, userId, profile, partnerProfile } = useAuth();
  const { rows: items, loading, refetch } = useTable<FinanceItem>('finances', 'couple_id', coupleId, {
    order: { column: 'due_date', ascending: true },
  });

  const [tab, setTab] = useState<'subscription' | 'borrowing'>('subscription');
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // form state
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(toDateInput(new Date()));
  const [renewalCycle, setRenewalCycle] = useState<'none' | 'monthly' | 'yearly'>('monthly');
  const [borrower, setBorrower] = useState<'me' | 'partner'>('me');
  const [selfLiability, setSelfLiability] = useState(false);

  const summary = useMemo(
    () => summarizeFinances(items, userId, partnerProfile?.id, new Date()),
    [items, userId, partnerProfile?.id],
  );

  const nameOf = (id: string | null) =>
    !id ? '—' : id === userId ? profile?.display_name ?? 'You' : partnerProfile?.display_name ?? 'Partner';

  const create = async () => {
    const amt = parseFloat(amount);
    if (!itemName.trim() || !coupleId || !userId || !Number.isFinite(amt) || amt <= 0) return;
    setBusy(true);
    const base = {
      couple_id: coupleId,
      type: tab,
      item_name: itemName.trim(),
      amount: amt,
      due_date: new Date(dueDate).toISOString(),
      status: 'pending' as const,
      created_by: userId,
    };
    if (tab === 'subscription') {
      await supabase.from('finances').insert({
        ...base,
        renewal_cycle: renewalCycle,
        is_self_liability: selfLiability,
        lender_id: null,
        borrower_id: null,
      });
    } else {
      const borrowerId = borrower === 'me' ? userId : partnerProfile?.id ?? userId;
      const lenderId = borrower === 'me' ? partnerProfile?.id ?? userId : userId;
      await supabase.from('finances').insert({
        ...base,
        renewal_cycle: 'none',
        is_self_liability: false,
        lender_id: lenderId,
        borrower_id: borrowerId,
      });
    }
    setBusy(false);
    setItemName('');
    setAmount('');
    setModalOpen(false);
    refetch();
  };

  const settle = async (item: FinanceItem) => {
    if (isRecurring(item)) {
      // Roll the due date forward one cycle; keep it pending for next period.
      const next = nextDueDate(parseLocalDate(item.due_date), item.renewal_cycle as 'monthly' | 'yearly');
      await supabase
        .from('finances')
        .update({
          due_date: toLocalISODate(next),
          last_paid_at: new Date().toISOString(),
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
    } else {
      await supabase
        .from('finances')
        .update({ status: 'paid', last_paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }
    refetch();
  };

  const reopen = async (item: FinanceItem) => {
    await supabase
      .from('finances')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', item.id);
    refetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await supabase.from('finances').delete().eq('id', id);
    refetch();
  };

  const list = items.filter((i) => i.type === tab);

  return (
    <div className="fade-up">
      <PageHeader
        title="Finances"
        subtitle="Subscriptions, borrowings & who owes whom"
        action={
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={17} /> Add
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-3" style={{ marginBottom: 22 }}>
        <div className="card pad">
          <div className="card-title">Outstanding</div>
          <div className="stat-number" style={{ marginTop: 6 }}>
            {currency(summary.combinedOutstanding)}
          </div>
          {summary.overdueCount > 0 && (
            <div className="row" style={{ gap: 5, marginTop: 6, color: 'var(--warning)', fontSize: 13 }}>
              <AlertTriangle size={14} /> {summary.overdueCount} overdue
            </div>
          )}
        </div>
        <div className="card pad">
          <div className="card-title">Monthly subscriptions</div>
          <div className="stat-number" style={{ marginTop: 6 }}>
            {currency(summary.monthlySubscriptionCost)}
          </div>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>
            {summary.activeSubscriptionCount} active
          </div>
        </div>
        <div className="card pad">
          <div className="card-title">Settlement</div>
          <div
            className="stat-number"
            style={{
              marginTop: 6,
              color: summary.netSettlement > 0 ? 'var(--lime)' : summary.netSettlement < 0 ? 'var(--brick)' : 'var(--text)',
            }}
          >
            {currency(Math.abs(summary.netSettlement))}
          </div>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>
            {summary.netSettlement > 0
              ? `${partnerProfile?.display_name ?? 'Partner'} owes you`
              : summary.netSettlement < 0
                ? `You owe ${partnerProfile?.display_name ?? 'partner'}`
                : 'All settled up'}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { key: 'subscription', label: 'Subscriptions' },
            { key: 'borrowing', label: 'Borrowings' },
          ]}
        />
      </div>

      {loading ? (
        <Loader />
      ) : list.length === 0 ? (
        <EmptyState icon={<Wallet size={40} />} title={`No ${tab}s yet`} />
      ) : (
        <div className="grid" style={{ gap: 10 }}>
          {list.map((item) => {
            const overdue = isOverdue(item);
            const paid = item.status === 'paid';
            return (
              <div key={item.id} className="list-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15.5, fontWeight: 700 }}>{item.item_name}</span>
                    {isRecurring(item) && (
                      <span className="pill" style={{ padding: '2px 8px', fontSize: 11 }}>
                        <RefreshCw size={11} /> {item.renewal_cycle}
                      </span>
                    )}
                    {item.is_self_liability && (
                      <span className="tag" style={{ background: 'var(--glass)', color: 'var(--text-muted)' }}>
                        personal
                      </span>
                    )}
                    {paid && (
                      <span className="tag" style={{ background: 'var(--glass-moss)', color: '#cfe6b4' }}>
                        paid
                      </span>
                    )}
                    {overdue && !paid && (
                      <span className="tag" style={{ background: 'var(--glass-danger)', color: '#ffb4b4' }}>
                        overdue
                      </span>
                    )}
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Due {formatDate(item.due_date)}
                    {item.type === 'borrowing' && ` · ${nameOf(item.borrower_id)} owes ${nameOf(item.lender_id)}`}
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, marginRight: 4 }}>{currency(Number(item.amount))}</div>
                {paid ? (
                  <button className="btn btn-ghost btn-sm" onClick={() => reopen(item)}>
                    Reopen
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => settle(item)}>
                    <CheckCircle2 size={14} /> {isRecurring(item) ? 'Renew' : 'Settle'}
                  </button>
                )}
                <button className="icon-btn danger" onClick={() => remove(item.id)} aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={tab === 'subscription' ? 'Add subscription' : 'Add borrowing'}
      >
        <div className="form-grid">
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { key: 'subscription', label: 'Subscription' },
              { key: 'borrowing', label: 'Borrowing' },
            ]}
          />
          <div>
            <label className="label">{tab === 'subscription' ? 'Service name' : 'What was borrowed'}</label>
            <input
              className="field"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={tab === 'subscription' ? 'Netflix, Spotify…' : 'Dinner, cab fare…'}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input
              className="field"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="label">{tab === 'subscription' ? 'Next due date' : 'Due date'}</label>
            <input
              className="field"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {tab === 'subscription' ? (
            <>
              <div>
                <label className="label">Renewal</label>
                <SegmentedControl
                  value={renewalCycle}
                  onChange={setRenewalCycle}
                  options={[
                    { key: 'monthly', label: 'Monthly' },
                    { key: 'yearly', label: 'Yearly' },
                    { key: 'none', label: 'One-off' },
                  ]}
                />
              </div>
              <label className="row" style={{ gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selfLiability}
                  onChange={(e) => setSelfLiability(e.target.checked)}
                />
                <span style={{ fontSize: 14 }} className="muted">
                  Personal — only mine, excluded from shared split
                </span>
              </label>
            </>
          ) : (
            <div>
              <label className="label">Who borrowed?</label>
              <SegmentedControl
                value={borrower}
                onChange={setBorrower}
                options={[
                  { key: 'me', label: `Me (I owe)` },
                  { key: 'partner', label: `${partnerProfile?.display_name ?? 'Partner'} owes` },
                ]}
              />
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={create} disabled={busy}>
              Add
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
