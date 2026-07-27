import type { PeriodRecord } from './types';

// Ported from the mobile app's utils/cycleMath.ts.

export type CyclePhase = 'Menstruation' | 'Follicular' | 'Ovulation' | 'Luteal' | 'Unknown';

export interface CyclePrediction {
  avgCycleLength: number;
  avgPeriodLength: number;
  currentCycleStart: Date;
  nextPeriodStart: Date;
  predictedOvulation: Date;
  fertileWindowStart: Date;
  fertileWindowEnd: Date;
  currentPhase: CyclePhase;
  cycleDay: number;
  daysUntilNextPeriod: number;
  cyclesSkipped: number;
  isStale: boolean;
  confidence: 'low' | 'medium' | 'high';
}

const DAY_MS = 24 * 60 * 60 * 1000;
const LUTEAL_PHASE_DAYS = 14;
const MIN_CYCLE = 15;
const MAX_CYCLE = 45;
const RECENT_INTERVALS = 6;

function parseLocalDate(value: string): Date {
  const [datePart] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function calculateCyclePredictions(
  historicalPeriods: PeriodRecord[],
  standardCycleLength = 28,
): CyclePrediction | null {
  if (!historicalPeriods || historicalPeriods.length === 0) return null;

  const sorted = [...historicalPeriods]
    .map((record) => ({ record, start: parseLocalDate(record.start_date) }))
    .filter(({ start }) => !isNaN(start.getTime()))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (sorted.length === 0) return null;

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(sorted[i - 1].start, sorted[i].start);
    if (gap >= MIN_CYCLE && gap <= MAX_CYCLE) intervals.push(gap);
  }

  const recentIntervals = intervals.slice(-RECENT_INTERVALS);
  const latest = sorted[sorted.length - 1];

  const override = latest.record.cycle_length_override;
  const avgCycleLength =
    override && override >= MIN_CYCLE && override <= MAX_CYCLE
      ? override
      : recentIntervals.length > 0
        ? Math.round(recentIntervals.reduce((sum, n) => sum + n, 0) / recentIntervals.length)
        : standardCycleLength;

  const bleedLengths = sorted
    .filter(({ record }) => record.end_date)
    .map(({ record, start }) => daysBetween(start, parseLocalDate(record.end_date!)) + 1)
    .filter((n) => n >= 1 && n <= 12);

  const avgPeriodLength =
    bleedLengths.length > 0
      ? Math.round(bleedLengths.reduce((sum, n) => sum + n, 0) / bleedLengths.length)
      : 5;

  const today = startOfToday();
  let currentCycleStart = latest.start;
  let cyclesSkipped = 0;

  while (daysBetween(currentCycleStart, today) >= avgCycleLength) {
    currentCycleStart = addDays(currentCycleStart, avgCycleLength);
    cyclesSkipped++;
  }

  const cycleDay = daysBetween(currentCycleStart, today) + 1;
  const nextPeriodStart = addDays(currentCycleStart, avgCycleLength);

  const ovulationDay = Math.max(avgCycleLength - LUTEAL_PHASE_DAYS + 1, avgPeriodLength + 1);
  const fertileStartDay = Math.max(ovulationDay - 5, avgPeriodLength + 1);
  const fertileEndDay = Math.min(ovulationDay + 1, avgCycleLength);

  const predictedOvulation = addDays(currentCycleStart, ovulationDay - 1);
  const fertileWindowStart = addDays(currentCycleStart, fertileStartDay - 1);
  const fertileWindowEnd = addDays(currentCycleStart, fertileEndDay - 1);

  let currentPhase: CyclePhase;
  if (cycleDay <= avgPeriodLength) {
    currentPhase = 'Menstruation';
  } else if (cycleDay < fertileStartDay) {
    currentPhase = 'Follicular';
  } else if (cycleDay <= fertileEndDay) {
    currentPhase = 'Ovulation';
  } else {
    currentPhase = 'Luteal';
  }

  return {
    avgCycleLength,
    avgPeriodLength,
    currentCycleStart,
    nextPeriodStart,
    predictedOvulation,
    fertileWindowStart,
    fertileWindowEnd,
    currentPhase,
    cycleDay,
    daysUntilNextPeriod: daysBetween(today, nextPeriodStart),
    cyclesSkipped,
    isStale: cyclesSkipped >= 2,
    confidence:
      recentIntervals.length >= 3 ? 'high' : recentIntervals.length >= 1 ? 'medium' : 'low',
  };
}
