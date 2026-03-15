import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskList } from '../components/tasks/TaskList';
import type { Task } from '../types/task';

vi.mock('../hooks/useTasks', () => ({
  useCompleteTask: () => ({ mutate: vi.fn() }),
  useDeleteTask: () => ({ mutate: vi.fn() }),
  useArchiveTask: () => ({ mutate: vi.fn() }),
  useRescheduleTask: () => ({ mutate: vi.fn(), isPending: false }),
  useSubtasks: () => ({ data: [], isLoading: false }),
  useAddSubtask: () => ({ mutate: vi.fn(), isPending: false }),
  useCompleteSubtask: () => ({ mutate: vi.fn() }),
  useDeleteSubtask: () => ({ mutate: vi.fn() }),
}));

vi.mock('../api/shares', () => ({
  createShare: vi.fn(async () => ({ token: 'tok' })),
}));

vi.mock('../hooks/useDeadlineStatus', () => ({
  useDeadlineStatus: () => ({ status: 'future', label: null, progressPercent: null }),
}));

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    raw_input: 'task',
    title: 'Default Task',
    category: 'Work',
    priority: 3,
    scheduled_date: '2026-03-16',
    scheduled_time: '09:00',
    duration_minutes: 60,
    ai_reasoning: 'n/a',
    reminder_minutes_before: 15,
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
    ...overrides,
  };
}

function renderList(tasks: Task[], options: { isLoading?: boolean; isPending?: boolean } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TaskList tasks={tasks} isLoading={options.isLoading} isPending={options.isPending} />
    </QueryClientProvider>
  );
}

describe('TaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no tasks and not loading', () => {
    renderList([]);
    expect(screen.getByText('All clear')).toBeInTheDocument();
  });

  it('does not show empty state when loading', () => {
    renderList([], { isLoading: true });
    expect(screen.queryByText('All clear')).not.toBeInTheDocument();
  });

  it('does not show empty state when isPending is true', () => {
    renderList([], { isPending: true });
    expect(screen.queryByText('All clear')).not.toBeInTheDocument();
  });

  it('shows day overload warning when today tasks exceed 480 minutes', () => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const tasks = [
      makeTask({ id: 't1', scheduled_date: todayStr, duration_minutes: 300 }),
      makeTask({ id: 't2', scheduled_date: todayStr, duration_minutes: 200 }),
    ];
    renderList(tasks);
    expect(screen.getByText('Day overloaded')).toBeInTheDocument();
  });

  it('does not show overload warning when today tasks are under 480 minutes', () => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const tasks = [makeTask({ id: 't1', scheduled_date: todayStr, duration_minutes: 60 })];
    renderList(tasks);
    expect(screen.queryByText('Day overloaded')).not.toBeInTheDocument();
  });

  it('shows "Doom List" section when tasks are overdue 3+ days', () => {
    // A task overdue 4 days ago
    const overdueDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const overdueStr = `${overdueDate.getFullYear()}-${pad(overdueDate.getMonth() + 1)}-${pad(overdueDate.getDate())}`;

    const tasks = [makeTask({ id: 't1', scheduled_date: overdueStr, title: 'Very Old Task' })];
    renderList(tasks);
    expect(screen.getByText('Doom List')).toBeInTheDocument();
  });

  it('does not show "Doom List" when all tasks are recent', () => {
    renderList([makeTask()]);
    expect(screen.queryByText('Doom List')).not.toBeInTheDocument();
  });

  it('renders priority group label for medium priority tasks', () => {
    renderList([makeTask({ priority: 3 })]);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders completed tasks in a Done section', () => {
    renderList([makeTask({ is_completed: true, completed_at: '2026-03-15T10:00:00Z' })]);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders skeleton loaders when isLoading is true', () => {
    const { container } = renderList([], { isLoading: true });
    // TaskCardSkeleton renders with animate-pulse
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });
});
