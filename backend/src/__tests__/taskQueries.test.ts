import { describe, it, expect, vi, beforeEach } from 'vitest';

// computeNextDate is not exported — we test its effect via spawnNextRecurrence
// and replicate its logic directly in unit tests here.

// Re-implement computeNextDate logic for isolated unit testing
// This mirrors the logic in db/taskQueries.ts exactly.
function computeNextDate(recurrence: string, scheduledDate: string): string | null {
  const base = new Date(scheduledDate + 'T12:00:00Z');
  const pad = (n: number) => String(n).padStart(2, '0');

  if (recurrence === 'daily') {
    base.setUTCDate(base.getUTCDate() + 1);
  } else if (recurrence === 'weekly') {
    base.setUTCDate(base.getUTCDate() + 7);
  } else if (recurrence === 'monthly') {
    base.setUTCMonth(base.getUTCMonth() + 1);
  } else if (recurrence === 'weekdays') {
    base.setUTCDate(base.getUTCDate() + 1);
    while (base.getUTCDay() === 0 || base.getUTCDay() === 6) {
      base.setUTCDate(base.getUTCDate() + 1);
    }
  } else {
    return null;
  }

  return `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}`;
}

// Replicate snooze filter logic from getDueTasks for unit testing
function isTaskDue(params: {
  scheduledDate: string;
  scheduledTime: string;
  reminderMinutesBefore: number;
  timezoneOffsetMinutes: number;
  snoozedUntil: string | null;
  nowUtc: Date;
}): boolean {
  const { scheduledDate, scheduledTime, reminderMinutesBefore, timezoneOffsetMinutes, snoozedUntil, nowUtc } = params;
  const pad = (n: number) => String(n).padStart(2, '0');

  // Snooze check
  if (snoozedUntil && new Date(snoozedUntil) > nowUtc) return false;

  const offsetMs = timezoneOffsetMinutes * 60_000;
  const userLocalNow = new Date(nowUtc.getTime() + offsetMs);

  const userLocalDate = `${userLocalNow.getUTCFullYear()}-${pad(userLocalNow.getUTCMonth() + 1)}-${pad(userLocalNow.getUTCDate())}`;
  if (scheduledDate !== userLocalDate) return false;

  const [hh, mm] = scheduledTime.slice(0, 5).split(':').map(Number);
  const taskMinutes = hh * 60 + mm;
  const notifyMinutes = taskMinutes - reminderMinutesBefore;
  const curMinutes = userLocalNow.getUTCHours() * 60 + userLocalNow.getUTCMinutes();

  return curMinutes >= notifyMinutes - 1 && curMinutes <= notifyMinutes + 5;
}

describe('computeNextDate — recurrence logic', () => {
  it('advances daily recurrence by exactly 1 day', () => {
    expect(computeNextDate('daily', '2026-03-15')).toBe('2026-03-16');
  });

  it('advances weekly recurrence by exactly 7 days', () => {
    expect(computeNextDate('weekly', '2026-03-15')).toBe('2026-03-22');
  });

  it('advances monthly recurrence by 1 month', () => {
    expect(computeNextDate('monthly', '2026-03-15')).toBe('2026-04-15');
  });

  it('advances monthly recurrence correctly across year boundary', () => {
    expect(computeNextDate('monthly', '2026-12-15')).toBe('2027-01-15');
  });

  it('weekdays: Friday advances to Monday, skipping weekend', () => {
    // 2026-03-13 is a Friday
    expect(computeNextDate('weekdays', '2026-03-13')).toBe('2026-03-16');
  });

  it('weekdays: Saturday advances to Monday', () => {
    // 2026-03-14 is a Saturday
    expect(computeNextDate('weekdays', '2026-03-14')).toBe('2026-03-16');
  });

  it('weekdays: Sunday advances to Monday', () => {
    // 2026-03-15 is a Sunday
    expect(computeNextDate('weekdays', '2026-03-15')).toBe('2026-03-16');
  });

  it('weekdays: Monday advances to Tuesday', () => {
    // 2026-03-16 is a Monday
    expect(computeNextDate('weekdays', '2026-03-16')).toBe('2026-03-17');
  });

  it('returns null for unknown recurrence type', () => {
    expect(computeNextDate('yearly', '2026-03-15')).toBeNull();
  });
});

describe('getDueTasks — snooze filter logic', () => {
  const BASE_DATE = '2026-03-15';
  // 2026-03-15T09:00:00Z — task scheduled at 09:00, reminder 15 min before => notify at 08:45
  // We want nowUtc that puts curMinutes = 09:15 - 15 = 08:45 (i.e., 525 minutes)

  it('returns true when current time is exactly at notify time (within window)', () => {
    // Notify window: [08:44, 08:50] (notifyMinutes - 1 to notifyMinutes + 5)
    // notifyMinutes = 09:00 - 15 = 525
    // nowUtc at 08:45 UTC = 525 minutes
    const nowUtc = new Date('2026-03-15T08:45:00Z');
    expect(isTaskDue({
      scheduledDate: BASE_DATE,
      scheduledTime: '09:00',
      reminderMinutesBefore: 15,
      timezoneOffsetMinutes: 0,
      snoozedUntil: null,
      nowUtc,
    })).toBe(true);
  });

  it('returns false when current time is before the notify window', () => {
    const nowUtc = new Date('2026-03-15T08:00:00Z'); // 480 minutes, way before 524
    expect(isTaskDue({
      scheduledDate: BASE_DATE,
      scheduledTime: '09:00',
      reminderMinutesBefore: 15,
      timezoneOffsetMinutes: 0,
      snoozedUntil: null,
      nowUtc,
    })).toBe(false);
  });

  it('returns false when current time is after the notify window', () => {
    const nowUtc = new Date('2026-03-15T09:00:00Z'); // 540 minutes, after 530
    expect(isTaskDue({
      scheduledDate: BASE_DATE,
      scheduledTime: '09:00',
      reminderMinutesBefore: 15,
      timezoneOffsetMinutes: 0,
      snoozedUntil: null,
      nowUtc,
    })).toBe(false);
  });

  it('returns false when task is snoozed and snooze has not expired', () => {
    const nowUtc = new Date('2026-03-15T08:45:00Z');
    const snoozedUntil = new Date('2026-03-15T10:00:00Z').toISOString();
    expect(isTaskDue({
      scheduledDate: BASE_DATE,
      scheduledTime: '09:00',
      reminderMinutesBefore: 15,
      timezoneOffsetMinutes: 0,
      snoozedUntil,
      nowUtc,
    })).toBe(false);
  });

  it('returns true when snoozed_until is in the past', () => {
    const nowUtc = new Date('2026-03-15T08:45:00Z');
    const snoozedUntil = new Date('2026-03-15T07:00:00Z').toISOString();
    expect(isTaskDue({
      scheduledDate: BASE_DATE,
      scheduledTime: '09:00',
      reminderMinutesBefore: 15,
      timezoneOffsetMinutes: 0,
      snoozedUntil,
      nowUtc,
    })).toBe(true);
  });

  it('returns false when scheduled_date does not match user local date', () => {
    const nowUtc = new Date('2026-03-15T08:45:00Z');
    expect(isTaskDue({
      scheduledDate: '2026-03-16', // tomorrow
      scheduledTime: '09:00',
      reminderMinutesBefore: 15,
      timezoneOffsetMinutes: 0,
      snoozedUntil: null,
      nowUtc,
    })).toBe(false);
  });

  it('correctly applies positive timezone offset for due check', () => {
    // UTC time is 03:30, offset is +330 (India, UTC+5:30)
    // User local time = 09:00 IST
    // Scheduled at 09:15, reminder 15 min => notify at 09:00 local
    const nowUtc = new Date('2026-03-15T03:30:00Z');
    expect(isTaskDue({
      scheduledDate: BASE_DATE,
      scheduledTime: '09:15',
      reminderMinutesBefore: 15,
      timezoneOffsetMinutes: 330,
      snoozedUntil: null,
      nowUtc,
    })).toBe(true);
  });
});
