import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareWarning, ListTodo, Wallet, Droplets, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTable } from '../lib/useTable';
import { MOODS, MOOD_EMOJI, partnerMoodAdvice, PHASE_COLOR } from '../lib/constants';
import { summarizeFinances } from '../lib/finance';
import { calculateCyclePredictions } from '../lib/cycle';
import { currency } from '../lib/format';
import type { Complaint, Todo, FinanceItem, PeriodRecord } from '../types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard() {
  const { profile, partnerProfile, coupleId, userId } = useAuth();
  const [myMood, setMyMood] = useState(profile?.current_mood ?? 'Neutral');
  const [partnerMood, setPartnerMood] = useState(partnerProfile?.current_mood ?? 'Neutral');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { rows: complaints } = useTable<Complaint>('complaints', 'couple_id', coupleId);
  const { rows: todos } = useTable<Todo>('todos', 'couple_id', coupleId, {
    order: { column: 'due_at', ascending: true },
  });
  const { rows: finances } = useTable<FinanceItem>('finances', 'couple_id', coupleId);
  const { rows: periods } = useTable<PeriodRecord>('periods', 'couple_id', coupleId);

  // Live mood sync — mirrors the app's broadcast channel `mood-sync:<coupleId>`.
  useEffect(() => {
    if (!coupleId) return;
    setMyMood(profile?.current_mood ?? 'Neutral');
    setPartnerMood(partnerProfile?.current_mood ?? 'Neutral');

    const ch = supabase
      .channel(`mood-sync:${coupleId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'mood_update' }, ({ payload }) => {
        setPartnerMood(payload.mood);
      })
      .subscribe();
    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, partnerProfile?.current_mood, profile?.current_mood]);

  const updateMood = async (mood: string) => {
    setMyMood(mood);
    channelRef.current?.send({ type: 'broadcast', event: 'mood_update', payload: { mood } });
    if (userId) {
      await supabase
        .from('profiles')
        .update({ current_mood: mood, mood_updated_at: new Date().toISOString() })
        .eq('id', userId);
    }
  };

  const openComplaints = complaints.filter((c) => c.status === 'open').length;
  const upcomingTodos = todos.filter((t) => !t.is_completed).length;

  const summary = useMemo(
    () => summarizeFinances(finances, userId, partnerProfile?.id, new Date()),
    [finances, userId, partnerProfile?.id],
  );

  const cycle = useMemo(() => calculateCyclePredictions(periods), [periods]);

  const partnerName = partnerProfile?.display_name ?? 'your partner';

  return (
    <div className="fade-up">
      <header style={{ marginBottom: 28 }}>
        <p className="muted" style={{ fontSize: 15 }}>
          {greeting()},
        </p>
        <h1 className="display" style={{ fontSize: 34, letterSpacing: '-0.02em' }}>
          {profile?.display_name} 🌿
        </h1>
      </header>

      {/* Mood */}
      <div className="card pad-lg" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>
          Update my emotional capacity
        </div>
        <div className="mood-row">
          {MOODS.filter((m) => m !== 'Neutral').map((m) => (
            <button
              key={m}
              className={`mood-btn ${myMood === m ? 'active' : ''}`}
              onClick={() => updateMood(m)}
            >
              <span className="mood-emoji">{MOOD_EMOJI[m]}</span>
              <span className="mood-label">{m}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Partner advice */}
      {partnerProfile && (
        <div className="card pad-lg" style={{ marginBottom: 20 }}>
          <div className="row" style={{ gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 30 }}>{MOOD_EMOJI[partnerMood] ?? '🙂'}</span>
            <div>
              <div className="card-title">{partnerName} is feeling</div>
              <div className="display" style={{ fontSize: 20 }}>
                {partnerMood}
              </div>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
            {partnerMoodAdvice(partnerMood, partnerName)}
          </p>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-2">
        <StatCard
          to="/complaints"
          icon={<MessageSquareWarning size={20} />}
          label="Open complaints"
          value={String(openComplaints)}
          tone={openComplaints > 0 ? 'danger' : 'default'}
        />
        <StatCard
          to="/todos"
          icon={<ListTodo size={20} />}
          label="Pending to-dos"
          value={String(upcomingTodos)}
        />
        <StatCard
          to="/finances"
          icon={<Wallet size={20} />}
          label="Outstanding"
          value={currency(summary.combinedOutstanding)}
          tone={summary.overdueCount > 0 ? 'warning' : 'default'}
          hint={
            summary.netSettlement !== 0
              ? summary.netSettlement > 0
                ? `${partnerName} owes you ${currency(Math.abs(summary.netSettlement))}`
                : `You owe ${partnerName} ${currency(Math.abs(summary.netSettlement))}`
              : 'All settled up'
          }
        />
        <StatCard
          to="/periods"
          icon={<Droplets size={20} />}
          label="Cycle"
          value={cycle ? cycle.currentPhase : '—'}
          tone="default"
          accent={cycle ? PHASE_COLOR[cycle.currentPhase] : undefined}
          hint={
            cycle
              ? cycle.daysUntilNextPeriod >= 0
                ? `Next period in ${cycle.daysUntilNextPeriod}d`
                : `${Math.abs(cycle.daysUntilNextPeriod)}d late`
              : 'No data yet'
          }
        />
      </div>
    </div>
  );
}

function StatCard({
  to,
  icon,
  label,
  value,
  hint,
  tone = 'default',
  accent,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'danger' | 'warning';
  accent?: string;
}) {
  const color =
    accent ??
    (tone === 'danger' ? 'var(--brick)' : tone === 'warning' ? 'var(--warning)' : 'var(--lime)');
  return (
    <Link to={to} className="card pad" style={{ display: 'block' }}>
      <div className="spread" style={{ marginBottom: 12 }}>
        <span style={{ color }}>{icon}</span>
        <ArrowRight size={16} className="faint" />
      </div>
      <div className="stat-number" style={{ color, fontSize: 28 }}>
        {value}
      </div>
      <div className="muted" style={{ fontSize: 13, marginTop: 4, fontWeight: 600 }}>
        {label}
      </div>
      {hint && (
        <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>
          {hint}
        </div>
      )}
    </Link>
  );
}
