import { useMemo, useState } from 'react';
import { Plus, Trash2, Utensils, Moon, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTable } from '../lib/useTable';
import { PageHeader, EmptyState, Loader, SegmentedControl } from '../components/ui';
import { Modal } from '../components/Modal';
import { MEAL_TYPES } from '../lib/constants';
import { formatDate, toDateInput, toDateTimeInput } from '../lib/format';
import type { DietLog, SleepLog } from '../types';

export function Health() {
  const [tab, setTab] = useState<'diet' | 'sleep'>('diet');
  return (
    <div className="fade-up">
      <PageHeader title="Health" subtitle="Your personal diet & sleep logs" />
      <div style={{ marginBottom: 22 }}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { key: 'diet', label: '🍽️ Diet' },
            { key: 'sleep', label: '😴 Sleep' },
          ]}
        />
      </div>
      {tab === 'diet' ? <DietSection /> : <SleepSection />}
    </div>
  );
}

function DietSection() {
  const { userId } = useAuth();
  const { rows: logs, loading, refetch } = useTable<DietLog>('diet_logs', 'user_id', userId, {
    order: { column: 'log_date', ascending: false },
  });

  const [open, setOpen] = useState(false);
  const [logDate, setLogDate] = useState(toDateInput(new Date()));
  const [mealType, setMealType] = useState<(typeof MEAL_TYPES)[number]>('breakfast');
  const [calories, setCalories] = useState('');
  const [food, setFood] = useState('');
  const [busy, setBusy] = useState(false);

  const todayTotal = useMemo(() => {
    const today = toDateInput(new Date());
    return logs.filter((l) => l.log_date === today).reduce((s, l) => s + l.calories, 0);
  }, [logs]);

  const create = async () => {
    const cal = parseInt(calories, 10);
    if (!userId || !Number.isFinite(cal)) return;
    setBusy(true);
    await supabase.from('diet_logs').insert({
      user_id: userId,
      log_date: logDate,
      calories: cal,
      meal_type: mealType,
      food_description: food.trim() || null,
    });
    setBusy(false);
    setCalories('');
    setFood('');
    setOpen(false);
    refetch();
  };

  const remove = async (id: string) => {
    await supabase.from('diet_logs').delete().eq('id', id);
    refetch();
  };

  return (
    <>
      <div className="spread" style={{ marginBottom: 18 }}>
        <div className="pill">
          <Utensils size={14} /> {todayTotal} kcal today
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={17} /> Log meal
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : logs.length === 0 ? (
        <EmptyState icon={<Utensils size={40} />} title="No meals logged yet" />
      ) : (
        <div className="grid" style={{ gap: 10 }}>
          {logs.map((l) => (
            <div key={l.id} className="list-row">
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, textTransform: 'capitalize' }}>{l.meal_type}</span>
                  <span className="pill" style={{ padding: '2px 8px', fontSize: 11 }}>
                    {l.calories} kcal
                  </span>
                </div>
                {l.food_description && (
                  <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
                    {l.food_description}
                  </div>
                )}
                <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>
                  {formatDate(l.log_date)}
                </div>
              </div>
              <button className="icon-btn danger" onClick={() => remove(l.id)} aria-label="Delete">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Log a meal">
        <div className="form-grid">
          <div>
            <label className="label">Date</label>
            <input className="field" type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Meal</label>
            <SegmentedControl
              value={mealType}
              onChange={setMealType}
              options={MEAL_TYPES.map((m) => ({ key: m, label: m[0].toUpperCase() + m.slice(1) }))}
            />
          </div>
          <div>
            <label className="label">Calories</label>
            <input
              className="field"
              type="number"
              min="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="kcal"
            />
          </div>
          <div>
            <label className="label">Food (optional)</label>
            <input className="field" value={food} onChange={(e) => setFood(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={create} disabled={busy || !calories}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function SleepSection() {
  const { userId } = useAuth();
  const { rows: logs, loading, refetch } = useTable<SleepLog>('sleep_logs', 'user_id', userId, {
    order: { column: 'log_date', ascending: false },
  });

  const [open, setOpen] = useState(false);
  const now = new Date();
  const [sleepTime, setSleepTime] = useState(toDateTimeInput(new Date(now.getTime() - 8 * 3600_000)));
  const [wakeTime, setWakeTime] = useState(toDateTimeInput(now));
  const [quality, setQuality] = useState(3);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!userId) return;
    const sleep = new Date(sleepTime);
    const wake = new Date(wakeTime);
    const duration = Math.max(0, Math.round((wake.getTime() - sleep.getTime()) / 60000));
    setBusy(true);
    await supabase.from('sleep_logs').insert({
      user_id: userId,
      log_date: toDateInput(wake),
      sleep_time: sleep.toISOString(),
      wake_time: wake.toISOString(),
      duration_minutes: duration,
      quality_rating: quality,
    });
    setBusy(false);
    setOpen(false);
    refetch();
  };

  const remove = async (id: string) => {
    await supabase.from('sleep_logs').delete().eq('id', id);
    refetch();
  };

  const fmtDur = (min: number) => `${Math.floor(min / 60)}h ${min % 60}m`;

  return (
    <>
      <div className="spread" style={{ marginBottom: 18 }}>
        <div className="pill">
          <Moon size={14} /> {logs.length} nights logged
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={17} /> Log sleep
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : logs.length === 0 ? (
        <EmptyState icon={<Moon size={40} />} title="No sleep logged yet" />
      ) : (
        <div className="grid" style={{ gap: 10 }}>
          {logs.map((l) => (
            <div key={l.id} className="list-row">
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{fmtDur(l.duration_minutes)}</span>
                  <span className="row" style={{ gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        fill={i < l.quality_rating ? 'var(--warning)' : 'none'}
                        color={i < l.quality_rating ? 'var(--warning)' : 'var(--text-faint)'}
                      />
                    ))}
                  </span>
                </div>
                <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>
                  {formatDate(l.log_date)}
                </div>
              </div>
              <button className="icon-btn danger" onClick={() => remove(l.id)} aria-label="Delete">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Log sleep">
        <div className="form-grid">
          <div>
            <label className="label">Fell asleep</label>
            <input
              className="field"
              type="datetime-local"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Woke up</label>
            <input
              className="field"
              type="datetime-local"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Quality</label>
            <div className="row" style={{ gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setQuality(n)} className="icon-btn" style={{ width: 40, height: 40 }}>
                  <Star size={20} fill={n <= quality ? 'var(--warning)' : 'none'} color={n <= quality ? 'var(--warning)' : 'var(--text-faint)'} />
                </button>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={create} disabled={busy}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
