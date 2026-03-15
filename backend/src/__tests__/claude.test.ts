import { describe, it, expect } from 'vitest';
import { parseClaudeResponse, buildPrompt, buildReschedulePrompt, buildFocusPrompt } from '../services/claude';
import { ClaudeParseError } from '../types/claude';
import type { Task } from '../types/task';

const VALID_JSON = JSON.stringify({
  title: 'Book dentist appointment',
  category: 'Health',
  scheduled_date: '2026-03-16',
  scheduled_time: '09:00',
  duration_minutes: 60,
  priority: 2,
  reminder_minutes_before: 15,
  recurrence: null,
  context_tags: ['@phone'],
  note: 'Bring insurance card',
  reasoning: 'Health appointment booked for tomorrow morning.',
});

describe('parseClaudeResponse', () => {
  it('returns valid task when JSON is correct', () => {
    const result = parseClaudeResponse(VALID_JSON);
    expect(result.title).toBe('Book dentist appointment');
    expect(result.category).toBe('Health');
    expect(result.priority).toBe(2);
    expect(result.recurrence).toBeNull();
    expect(result.context_tags).toEqual(['@phone']);
    expect(result.note).toBe('Bring insurance card');
  });

  it('strips markdown code fences before parsing', () => {
    const wrapped = '```json\n' + VALID_JSON + '\n```';
    const result = parseClaudeResponse(wrapped);
    expect(result.title).toBe('Book dentist appointment');
  });

  it('throws ClaudeParseError when JSON is malformed', () => {
    expect(() => parseClaudeResponse('not json')).toThrow(ClaudeParseError);
  });

  it('throws ClaudeParseError when required field title is missing', () => {
    const obj = JSON.parse(VALID_JSON);
    delete obj.title;
    expect(() => parseClaudeResponse(JSON.stringify(obj))).toThrow(ClaudeParseError);
  });

  it('throws ClaudeParseError when required field category is missing', () => {
    const obj = JSON.parse(VALID_JSON);
    delete obj.category;
    expect(() => parseClaudeResponse(JSON.stringify(obj))).toThrow(ClaudeParseError);
  });

  it('throws ClaudeParseError when category is invalid', () => {
    const obj = JSON.parse(VALID_JSON);
    obj.category = 'Hobby';
    expect(() => parseClaudeResponse(JSON.stringify(obj))).toThrow(ClaudeParseError);
  });

  it('throws ClaudeParseError when priority is out of range', () => {
    const obj = JSON.parse(VALID_JSON);
    obj.priority = 6;
    expect(() => parseClaudeResponse(JSON.stringify(obj))).toThrow(ClaudeParseError);
  });

  it('throws ClaudeParseError when priority is 0', () => {
    const obj = JSON.parse(VALID_JSON);
    obj.priority = 0;
    expect(() => parseClaudeResponse(JSON.stringify(obj))).toThrow(ClaudeParseError);
  });

  it('parses valid recurrence daily', () => {
    const obj = JSON.parse(VALID_JSON);
    obj.recurrence = 'daily';
    expect(parseClaudeResponse(JSON.stringify(obj)).recurrence).toBe('daily');
  });

  it('parses valid recurrence weekdays', () => {
    const obj = JSON.parse(VALID_JSON);
    obj.recurrence = 'weekdays';
    expect(parseClaudeResponse(JSON.stringify(obj)).recurrence).toBe('weekdays');
  });

  it('parses valid recurrence weekly', () => {
    const obj = JSON.parse(VALID_JSON);
    obj.recurrence = 'weekly';
    expect(parseClaudeResponse(JSON.stringify(obj)).recurrence).toBe('weekly');
  });

  it('parses valid recurrence monthly', () => {
    const obj = JSON.parse(VALID_JSON);
    obj.recurrence = 'monthly';
    expect(parseClaudeResponse(JSON.stringify(obj)).recurrence).toBe('monthly');
  });

  it('sets recurrence to null for unknown recurrence strings', () => {
    const obj = JSON.parse(VALID_JSON);
    obj.recurrence = 'yearly';
    expect(parseClaudeResponse(JSON.stringify(obj)).recurrence).toBeNull();
  });

  it('filters invalid context_tags and keeps valid ones', () => {
    const obj = JSON.parse(VALID_JSON);
    obj.context_tags = ['@home', '@invalid', '@work'];
    const result = parseClaudeResponse(JSON.stringify(obj));
    expect(result.context_tags).toEqual(['@home', '@work']);
  });

  it('returns empty array when context_tags is absent', () => {
    const obj = JSON.parse(VALID_JSON);
    delete obj.context_tags;
    expect(parseClaudeResponse(JSON.stringify(obj)).context_tags).toEqual([]);
  });

  it('sets note to null when note field is absent', () => {
    const obj = JSON.parse(VALID_JSON);
    delete obj.note;
    expect(parseClaudeResponse(JSON.stringify(obj)).note).toBeNull();
  });

  it('sets note to null when note is not a string', () => {
    const obj = JSON.parse(VALID_JSON);
    obj.note = 42;
    expect(parseClaudeResponse(JSON.stringify(obj)).note).toBeNull();
  });

  it('defaults reminder_minutes_before to 15 when absent', () => {
    const obj = JSON.parse(VALID_JSON);
    delete obj.reminder_minutes_before;
    expect(parseClaudeResponse(JSON.stringify(obj)).reminder_minutes_before).toBe(15);
  });

  it('clamps reminder_minutes_before to 0 when negative', () => {
    const obj = JSON.parse(VALID_JSON);
    obj.reminder_minutes_before = -5;
    expect(parseClaudeResponse(JSON.stringify(obj)).reminder_minutes_before).toBe(0);
  });

  it('truncates title to 60 characters', () => {
    const obj = JSON.parse(VALID_JSON);
    obj.title = 'A'.repeat(80);
    expect(parseClaudeResponse(JSON.stringify(obj)).title).toHaveLength(60);
  });

  it('accepts all five valid categories', () => {
    const cats = ['Work', 'Study', 'Personal', 'Health', 'Errand'];
    for (const cat of cats) {
      const obj = JSON.parse(VALID_JSON);
      obj.category = cat;
      expect(parseClaudeResponse(JSON.stringify(obj)).category).toBe(cat);
    }
  });
});

describe('buildPrompt', () => {
  it('includes the raw input in the returned prompt', () => {
    const prompt = buildPrompt('Call dentist', [], '2026-03-15T09:00:00+00:00');
    expect(prompt).toContain('Call dentist');
  });

  it('includes current date in the returned prompt', () => {
    const prompt = buildPrompt('Task', [], '2026-03-15T09:00:00+00:00');
    expect(prompt).toContain('2026-03-15T09:00:00+00:00');
  });

  it('includes learned preference rules when provided', () => {
    const prompt = buildPrompt('Task', ['Always schedule health tasks in the morning'], '2026-03-15T09:00:00+00:00');
    expect(prompt).toContain('Always schedule health tasks in the morning');
    expect(prompt).toContain('Learned User Preferences');
  });

  it('omits preference block when no rules provided', () => {
    const prompt = buildPrompt('Task', [], '2026-03-15T09:00:00+00:00');
    expect(prompt).not.toContain('Learned User Preferences');
  });

  it('includes timezone when provided', () => {
    const prompt = buildPrompt('Task', [], '2026-03-15T09:00:00+05:30', 'Asia/Kolkata');
    expect(prompt).toContain('Asia/Kolkata');
  });

  it('includes energy level block when energyLevel is provided', () => {
    const prompt = buildPrompt('Task', [], '2026-03-15T09:00:00+00:00', undefined, 'high');
    expect(prompt).toContain('HIGH');
  });
});

describe('buildReschedulePrompt', () => {
  const task: Task = {
    id: 'abc-123',
    user_id: 'test-user',
    raw_input: 'dentist',
    title: 'Dentist appointment',
    category: 'Health',
    priority: 2,
    scheduled_date: '2026-03-10',
    scheduled_time: '10:00',
    duration_minutes: 60,
    ai_reasoning: 'Health task',
    reminder_minutes_before: 15,
    timezone_offset_minutes: 0,
    is_completed: false,
    completed_at: null,
    reminder_sent: false,
    is_archived: false,
    recurrence: null,
    recurrence_parent_id: null,
    context_tags: [],
    note: null,
    snoozed_until: null,
    created_at: '2026-03-01T00:00:00Z',
  };

  it('contains the task title in the prompt', () => {
    const prompt = buildReschedulePrompt(task, '2026-03-15T09:00:00Z');
    expect(prompt).toContain('Dentist appointment');
  });

  it('contains the current date in the prompt', () => {
    const prompt = buildReschedulePrompt(task, '2026-03-15T09:00:00Z');
    expect(prompt).toContain('2026-03-15T09:00:00Z');
  });

  it('requests only scheduled_date and scheduled_time fields', () => {
    const prompt = buildReschedulePrompt(task, '2026-03-15T09:00:00Z');
    expect(prompt).toContain('"scheduled_date"');
    expect(prompt).toContain('"scheduled_time"');
  });
});

describe('buildFocusPrompt', () => {
  const tasks: Task[] = [
    {
      id: 'task-1',
      user_id: 'test-user',
      raw_input: 'write report',
      title: 'Write quarterly report',
      category: 'Work',
      priority: 1,
      scheduled_date: '2026-03-15',
      scheduled_time: '09:00',
      duration_minutes: 120,
      ai_reasoning: 'High priority work task',
      reminder_minutes_before: 15,
      timezone_offset_minutes: 0,
      is_completed: false,
      completed_at: null,
      reminder_sent: false,
      is_archived: false,
      recurrence: null,
      recurrence_parent_id: null,
      context_tags: ['@work'],
      note: null,
      snoozed_until: null,
      created_at: '2026-03-14T00:00:00Z',
    },
  ];

  it('includes task title in the prompt', () => {
    const prompt = buildFocusPrompt(tasks, '2026-03-15T09:00:00Z');
    expect(prompt).toContain('Write quarterly report');
  });

  it('includes task id in the prompt', () => {
    const prompt = buildFocusPrompt(tasks, '2026-03-15T09:00:00Z');
    expect(prompt).toContain('task-1');
  });

  it('requests task_id and reason fields in output', () => {
    const prompt = buildFocusPrompt(tasks, '2026-03-15T09:00:00Z');
    expect(prompt).toContain('"task_id"');
    expect(prompt).toContain('"reason"');
  });

  it('limits to 20 tasks in the prompt', () => {
    const manyTasks: Task[] = Array.from({ length: 25 }, (_, i) => ({
      ...tasks[0],
      id: `task-${i}`,
      title: `Task ${i}`,
    }));
    const prompt = buildFocusPrompt(manyTasks, '2026-03-15T09:00:00Z');
    // Only first 20 tasks should appear — check that task-20 is not present
    expect(prompt).not.toContain('Task 20');
  });
});
