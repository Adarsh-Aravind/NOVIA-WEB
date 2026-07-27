import type { CheckIn } from './types';

/** Local 'YYYY-MM-DD' — matches the check_ins DATE column semantics. */
export function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Consecutive-day streak ending today (or yesterday, so it isn't lost until a
 * full day is actually missed). Mirrors the app's useCheckIns.
 */
export function computeStreak(rows: Pick<CheckIn, 'check_in_date'>[]): number {
  const dates = new Set(rows.map((r) => r.check_in_date));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!dates.has(localISODate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dates.has(localISODate(cursor))) return 0;
  }
  let streak = 0;
  while (dates.has(localISODate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
