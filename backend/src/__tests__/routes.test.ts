/**
 * Integration tests for key HTTP routes using supertest.
 * Supabase, Claude API, and preferences are mocked at module level.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must mock BEFORE any other imports that transitively load supabase or claude
vi.mock('../db/supabase', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('../services/claude', () => ({
  buildPrompt: vi.fn(() => 'mock-prompt'),
  callClaude: vi.fn(async () => JSON.stringify({
    title: 'Test task',
    category: 'Work',
    scheduled_date: '2026-03-16',
    scheduled_time: '09:00',
    duration_minutes: 60,
    priority: 2,
    reminder_minutes_before: 15,
    recurrence: null,
    context_tags: [],
    note: null,
    reasoning: 'Test reasoning',
  })),
  parseClaudeResponse: vi.fn(() => ({
    title: 'Test task',
    category: 'Work',
    scheduled_date: '2026-03-16',
    scheduled_time: '09:00',
    duration_minutes: 60,
    priority: 2,
    reminder_minutes_before: 15,
    recurrence: null,
    context_tags: [],
    note: null,
    reasoning: 'Test reasoning',
  })),
  buildReschedulePrompt: vi.fn(() => 'mock-reschedule-prompt'),
  buildFocusPrompt: vi.fn(() => 'mock-focus-prompt'),
}));

vi.mock('../services/preferences', () => ({
  buildRules: vi.fn(async () => []),
  buildLearningContext: vi.fn(async () => ({
    priorityRules: [], categoryRules: [], timeRules: [],
    durationRules: [], behaviorProfile: [], reasonInsights: [],
  })),
}));

const MOCK_TASK = {
  id: 'task-uuid-1',
  raw_input: 'write report',
  title: 'Test task',
  category: 'Work',
  priority: 2,
  scheduled_date: '2026-03-16',
  scheduled_time: '09:00',
  duration_minutes: 60,
  ai_reasoning: 'Test reasoning',
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
  created_at: '2026-03-15T00:00:00Z',
};

vi.mock('../db/taskQueries', () => ({
  insertTask: vi.fn(async () => MOCK_TASK),
  listTasks: vi.fn(async () => [MOCK_TASK]),
  markComplete: vi.fn(async () => ({ ...MOCK_TASK, is_completed: true })),
  deleteTask: vi.fn(async () => undefined),
  archiveTask: vi.fn(async () => ({ ...MOCK_TASK, is_archived: true })),
  spawnNextRecurrence: vi.fn(async () => undefined),
  updateTaskField: vi.fn(async (_id: string, field: string, value: unknown) => ({ ...MOCK_TASK, [field]: value })),
  snoozeTask: vi.fn(async (id: string, until: string) => ({ ...MOCK_TASK, snoozed_until: until })),
}));

vi.mock('../db/energyQueries', () => ({
  getTodayCheckin: vi.fn(async () => null),
  insertCheckin: vi.fn(async (_date: string, level: string) => ({
    id: 'checkin-1',
    date: '2026-03-15',
    level,
    created_at: '2026-03-15T00:00:00Z',
  })),
}));

// Now safe to import everything
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../middleware/errorHandler';
import tasksRouter from '../routes/tasks';
import energyRouter from '../routes/energy';
import focusRouter from '../routes/focus';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/tasks', tasksRouter);
  app.use('/api/energy', energyRouter);
  app.use('/api/focus', focusRouter);
  app.use(errorHandler);
  return app;
}

const app = buildApp();

describe('POST /api/tasks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when raw_input is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ current_date: '2026-03-15T09:00:00+00:00' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when current_date is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ raw_input: 'call dentist' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when current_date format is invalid (no T)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ raw_input: 'call dentist', current_date: '2026-03-15' });
    expect(res.status).toBe(400);
  });

  it('returns 201 with task when request is valid', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ raw_input: 'write quarterly report', current_date: '2026-03-15T09:00:00+00:00' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('task');
    expect(res.body.task.title).toBe('Test task');
  });
});

describe('GET /api/tasks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with tasks array', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tasks');
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  it('accepts category filter query param', async () => {
    const { listTasks } = await import('../db/taskQueries');
    await request(app).get('/api/tasks?category=Work');
    expect(listTasks).toHaveBeenCalledWith(expect.objectContaining({ category: 'Work' }));
  });

  it('passes is_completed=true when completed=true query param', async () => {
    const { listTasks } = await import('../db/taskQueries');
    await request(app).get('/api/tasks?completed=true');
    expect(listTasks).toHaveBeenCalledWith(expect.objectContaining({ is_completed: true }));
  });

  it('passes is_completed=false when completed=false query param', async () => {
    const { listTasks } = await import('../db/taskQueries');
    await request(app).get('/api/tasks?completed=false');
    expect(listTasks).toHaveBeenCalledWith(expect.objectContaining({ is_completed: false }));
  });
});

describe('PATCH /api/tasks/:id/archive', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with archived task', async () => {
    const res = await request(app).patch('/api/tasks/task-uuid-1/archive');
    expect(res.status).toBe(200);
    expect(res.body.task.is_archived).toBe(true);
  });
});

describe('PATCH /api/tasks/:id/snooze', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with snoozed task when minutes is valid', async () => {
    const res = await request(app)
      .patch('/api/tasks/task-uuid-1/snooze')
      .send({ minutes: 30 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('task');
  });

  it('returns 400 when minutes field is absent', async () => {
    const res = await request(app)
      .patch('/api/tasks/task-uuid-1/snooze')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when minutes is 0', async () => {
    const res = await request(app)
      .patch('/api/tasks/task-uuid-1/snooze')
      .send({ minutes: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when minutes is negative', async () => {
    const res = await request(app)
      .patch('/api/tasks/task-uuid-1/snooze')
      .send({ minutes: -10 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/energy/today', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with checkin null when no check-in exists', async () => {
    const res = await request(app).get('/api/energy/today');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ checkin: null });
  });
});

describe('POST /api/energy', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 201 with checkin when level is "high"', async () => {
    const res = await request(app).post('/api/energy').send({ level: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.checkin.level).toBe('high');
  });

  it('returns 400 when level is invalid', async () => {
    const res = await request(app).post('/api/energy').send({ level: 'extreme' });
    expect(res.status).toBe(400);
  });

  it('returns 201 when level is "medium"', async () => {
    const res = await request(app).post('/api/energy').send({ level: 'medium' });
    expect(res.status).toBe(201);
  });

  it('returns 201 when level is "low"', async () => {
    const res = await request(app).post('/api/energy').send({ level: 'low' });
    expect(res.status).toBe(201);
  });
});

describe('GET /api/focus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns task_id and reason when incomplete tasks exist', async () => {
    const { callClaude } = await import('../services/claude');
    vi.mocked(callClaude).mockResolvedValueOnce(
      JSON.stringify({ task_id: 'task-uuid-1', reason: 'Most urgent task' })
    );
    const res = await request(app).get('/api/focus');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('task_id');
    expect(res.body).toHaveProperty('reason');
  });

  it('returns task_id null when no incomplete tasks exist', async () => {
    const { listTasks } = await import('../db/taskQueries');
    vi.mocked(listTasks).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/focus');
    expect(res.status).toBe(200);
    expect(res.body.task_id).toBeNull();
  });
});
