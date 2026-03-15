import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockCreateTask = vi.fn();

vi.mock('../api/tasks', () => ({
  createTask: (...args: unknown[]) => mockCreateTask(...args),
  listTasks: vi.fn(async () => []),
  completeTask: vi.fn(),
  deleteTask: vi.fn(),
  archiveTask: vi.fn(),
  getSubtasks: vi.fn(async () => []),
  addSubtask: vi.fn(),
  completeSubtask: vi.fn(),
  deleteSubtask: vi.fn(),
  snoozeTask: vi.fn(),
  rescheduleTask: vi.fn(),
  updateTaskNote: vi.fn(),
  getDependencies: vi.fn(async () => []),
  addDependency: vi.fn(),
  removeDependency: vi.fn(),
}));

// We need the real hook for this test, not mocked
vi.mock('../hooks/useTasks', async (importOriginal) => {
  const real = await importOriginal() as Record<string, unknown>;
  return real;
});

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useCreateTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTask.mockResolvedValue({
      id: 'new-task',
      title: 'New task',
      category: 'Work',
      priority: 2,
    });
  });

  it('calls createTask with raw_input when passed a plain string', async () => {
    const { useCreateTask } = await import('../hooks/useTasks');
    const { result } = renderHook(() => useCreateTask(), { wrapper });

    result.current.mutate('buy groceries');

    await waitFor(() => expect(mockCreateTask).toHaveBeenCalled());

    const callArg = mockCreateTask.mock.calls[0][0];
    expect(callArg).toMatchObject({ raw_input: 'buy groceries' });
    expect(callArg).toHaveProperty('current_date');
    expect(callArg.current_date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('calls createTask with full object when passed an object', async () => {
    const { useCreateTask } = await import('../hooks/useTasks');
    const { result } = renderHook(() => useCreateTask(), { wrapper });

    const params = {
      raw_input: 'team meeting',
      current_date: '2026-03-15T09:00:00+05:30',
      timezone: 'Asia/Kolkata',
      energy_level: 'high',
    };
    result.current.mutate(params);

    await waitFor(() => expect(mockCreateTask).toHaveBeenCalledWith(params));
  });

  it('passes energy_level through when provided in object form', async () => {
    const { useCreateTask } = await import('../hooks/useTasks');
    const { result } = renderHook(() => useCreateTask(), { wrapper });

    result.current.mutate({
      raw_input: 'morning run',
      current_date: '2026-03-15T06:00:00+00:00',
      energy_level: 'low',
    });

    await waitFor(() => expect(mockCreateTask).toHaveBeenCalled());
    expect(mockCreateTask.mock.calls[0][0].energy_level).toBe('low');
  });

  it('mutation starts in idle state', async () => {
    const { useCreateTask } = await import('../hooks/useTasks');
    const { result } = renderHook(() => useCreateTask(), { wrapper });
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });
});
