import type { Milestone, MilestoneRecurrence } from './types';
import { parseLocalDate } from './finance';

// Ported from the mobile app's utils/milestoneMath.ts.

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((atMidnight(b).getTime() - atMidnight(a).getTime()) / 86400000);
}

/** The next calendar day (>= from) this milestone occurs, or null for a passed one-off. */
export function nextOccurrence(
  m: Pick<Milestone, 'milestone_date' | 'recurrence'>,
  from: Date = new Date(),
): Date | null {
  const base = parseLocalDate(m.milestone_date);
  if (isNaN(base.getTime())) return null;
  const start = atMidnight(from);

  if (m.recurrence === 'once') {
    return dayDiff(start, base) >= 0 ? base : null;
  }
  if (m.recurrence === 'monthly') {
    let candidate = new Date(start.getFullYear(), start.getMonth(), base.getDate());
    if (dayDiff(start, candidate) < 0) {
      candidate = new Date(start.getFullYear(), start.getMonth() + 1, base.getDate());
    }
    return candidate;
  }
  // yearly
  let candidate = new Date(start.getFullYear(), base.getMonth(), base.getDate());
  if (dayDiff(start, candidate) < 0) {
    candidate = new Date(start.getFullYear() + 1, base.getMonth(), base.getDate());
  }
  return candidate;
}

/** Days from today until the next occurrence (0 = today), or null if none. */
export function daysUntilNext(
  m: Pick<Milestone, 'milestone_date' | 'recurrence'>,
  from: Date = new Date(),
): number | null {
  const next = nextOccurrence(m, from);
  return next ? dayDiff(from, next) : null;
}

/** Years (yearly/once) or months (monthly) an occurrence marks since the original date. */
export function elapsedAt(
  m: Pick<Milestone, 'milestone_date' | 'recurrence'>,
  occurrence: Date,
): { count: number; unit: 'year' | 'month' } {
  const base = parseLocalDate(m.milestone_date);
  if (m.recurrence === 'monthly') {
    const months =
      (occurrence.getFullYear() - base.getFullYear()) * 12 +
      (occurrence.getMonth() - base.getMonth());
    return { count: Math.max(0, months), unit: 'month' };
  }
  return { count: Math.max(0, occurrence.getFullYear() - base.getFullYear()), unit: 'year' };
}

/** "3 years", "1 month", or '' when count is 0. */
export function formatElapsed(count: number, unit: 'year' | 'month'): string {
  if (count <= 0) return '';
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

export const MILESTONE_RECURRENCES: { key: MilestoneRecurrence; label: string }[] = [
  { key: 'yearly', label: 'Yearly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'once', label: 'One-off' },
];
