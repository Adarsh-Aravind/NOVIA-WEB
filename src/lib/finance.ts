import type { FinanceItem } from './types';

// Ported verbatim from the mobile app's utils/financeMath.ts so web totals and
// the who-owes-whom settlement match the app exactly.

export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(value: string): Date {
  const [datePart] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function isLastDayOfMonth(date: Date): boolean {
  return date.getDate() === daysInMonth(date.getFullYear(), date.getMonth());
}

export function addMonthsClamped(date: Date, months: number): Date {
  const targetMonth = date.getMonth() + months;
  const result = new Date(date.getFullYear(), targetMonth, 1);
  const targetLength = daysInMonth(result.getFullYear(), result.getMonth());
  const day = isLastDayOfMonth(date) ? targetLength : Math.min(date.getDate(), targetLength);
  result.setDate(day);
  result.setHours(date.getHours(), date.getMinutes(), 0, 0);
  return result;
}

export function nextDueDate(
  currentDue: Date,
  cycle: 'monthly' | 'yearly',
  now: Date = new Date(),
): Date {
  const step = cycle === 'yearly' ? 12 : 1;
  let cycles = 1;
  let next = addMonthsClamped(currentDue, step);
  while (next.getTime() <= now.getTime() && cycles < 600) {
    cycles++;
    next = addMonthsClamped(currentDue, step * cycles);
  }
  return next;
}

export function isRecurring(
  item: Pick<FinanceItem, 'renewal_cycle' | 'type' | 'is_self_liability'>,
): boolean {
  if (item.type !== 'subscription' || item.is_self_liability) return false;
  return item.renewal_cycle === 'monthly' || item.renewal_cycle === 'yearly';
}

export function isOverdue(
  item: Pick<FinanceItem, 'due_date' | 'status'>,
  now: Date = new Date(),
): boolean {
  if (item.status === 'paid') return false;
  const due = parseLocalDate(item.due_date);
  if (isNaN(due.getTime())) return false;
  return due.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export interface FinanceSummary {
  combinedOutstanding: number;
  sharedOutstanding: number;
  yourShare: number;
  partnerShare: number;
  yourSelfLiability: number;
  partnerSelfLiability: number;
  yourBorrowings: number;
  partnerBorrowings: number;
  netSettlement: number;
  monthlySubscriptionCost: number;
  activeSubscriptionCount: number;
  unattributed: number;
  overdueCount: number;
}

export function summarizeFinances(
  items: FinanceItem[],
  userId: string | null,
  partnerId: string | null | undefined,
  now: Date = new Date(),
): FinanceSummary {
  const summary: FinanceSummary = {
    combinedOutstanding: 0,
    sharedOutstanding: 0,
    yourShare: 0,
    partnerShare: 0,
    yourSelfLiability: 0,
    partnerSelfLiability: 0,
    yourBorrowings: 0,
    partnerBorrowings: 0,
    netSettlement: 0,
    monthlySubscriptionCost: 0,
    activeSubscriptionCount: 0,
    unattributed: 0,
    overdueCount: 0,
  };

  for (const item of items) {
    const amount = Number(item.amount);
    if (!Number.isFinite(amount)) continue;

    if (isRecurring(item)) {
      summary.activeSubscriptionCount++;
      summary.monthlySubscriptionCost += item.renewal_cycle === 'yearly' ? amount / 12 : amount;
    }

    if (item.status === 'paid') continue;
    if (isOverdue(item, now)) summary.overdueCount++;

    summary.combinedOutstanding += amount;

    if (item.is_self_liability) {
      if (item.created_by === userId) {
        summary.yourSelfLiability += amount;
        summary.yourShare += amount;
      } else if (partnerId && item.created_by === partnerId) {
        summary.partnerSelfLiability += amount;
        summary.partnerShare += amount;
      } else {
        summary.unattributed += amount;
      }
      continue;
    }

    summary.sharedOutstanding += amount;

    if (item.type === 'subscription') {
      summary.yourShare += amount / 2;
      summary.partnerShare += amount / 2;
    } else if (item.type === 'borrowing') {
      if (item.borrower_id === userId) {
        summary.yourShare += amount;
        summary.yourBorrowings += amount;
      } else if (partnerId && item.borrower_id === partnerId) {
        summary.partnerShare += amount;
        summary.partnerBorrowings += amount;
      } else {
        summary.unattributed += amount;
      }
    }
  }

  summary.netSettlement = summary.partnerBorrowings - summary.yourBorrowings;
  return summary;
}
