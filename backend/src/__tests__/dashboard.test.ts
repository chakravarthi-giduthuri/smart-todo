import { describe, it, expect } from 'vitest';

// Replicate the streak calculation logic from services/dashboard.ts for isolated testing.
// The logic: starting from today (or yesterday if today has no completions),
// count consecutive days going backwards that have at least 1 completion.

function localDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function calculateStreak(completedDates: Set<string>, today: string): number {
  let streak = 0;
  const check = new Date(today + 'T12:00:00');
  if (!completedDates.has(today)) check.setDate(check.getDate() - 1);
  for (let i = 0; i < 90; i++) {
    if (completedDates.has(localDateStr(check))) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

describe('streak calculation', () => {
  const TODAY = '2026-03-15';

  it('returns 0 when no completions exist', () => {
    const completedDates = new Set<string>();
    expect(calculateStreak(completedDates, TODAY)).toBe(0);
  });

  it('returns 1 when only today has a completion', () => {
    const completedDates = new Set(['2026-03-15']);
    expect(calculateStreak(completedDates, TODAY)).toBe(1);
  });

  it('returns 1 when only yesterday has a completion (today empty)', () => {
    const completedDates = new Set(['2026-03-14']);
    expect(calculateStreak(completedDates, TODAY)).toBe(1);
  });

  it('returns 2 for today and yesterday', () => {
    const completedDates = new Set(['2026-03-15', '2026-03-14']);
    expect(calculateStreak(completedDates, TODAY)).toBe(2);
  });

  it('returns 5 for five consecutive days ending today', () => {
    const completedDates = new Set([
      '2026-03-15',
      '2026-03-14',
      '2026-03-13',
      '2026-03-12',
      '2026-03-11',
    ]);
    expect(calculateStreak(completedDates, TODAY)).toBe(5);
  });

  it('breaks streak on a gap in the middle', () => {
    // Today + yesterday, gap, then 3 days earlier
    const completedDates = new Set([
      '2026-03-15',
      '2026-03-14',
      // '2026-03-13' missing — gap
      '2026-03-12',
      '2026-03-11',
    ]);
    expect(calculateStreak(completedDates, TODAY)).toBe(2);
  });

  it('returns 0 when the most recent completion is 2+ days ago', () => {
    const completedDates = new Set(['2026-03-12', '2026-03-11']);
    expect(calculateStreak(completedDates, TODAY)).toBe(0);
  });

  it('starts from yesterday when today has no completions', () => {
    // Yesterday and day before — no today
    const completedDates = new Set(['2026-03-14', '2026-03-13']);
    expect(calculateStreak(completedDates, TODAY)).toBe(2);
  });

  it('caps at 90 days maximum', () => {
    const dates = new Set<string>();
    for (let i = 0; i < 95; i++) {
      const d = new Date('2026-03-15T12:00:00');
      d.setDate(d.getDate() - i);
      dates.add(localDateStr(d));
    }
    // Streak should cap at 90 per the loop limit
    expect(calculateStreak(dates, TODAY)).toBe(90);
  });
});
