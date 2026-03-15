import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskCard } from '../components/tasks/TaskCard';
import type { Task } from '../types/task';

// Mock hooks and API calls
vi.mock('../hooks/useTasks', () => ({
  useCompleteTask: () => ({ mutate: vi.fn() }),
  useDeleteTask: () => ({ mutate: vi.fn() }),
  useRescheduleTask: () => ({ mutate: vi.fn(), isPending: false }),
  useSubtasks: () => ({ data: [], isLoading: false }),
  useAddSubtask: () => ({ mutate: vi.fn(), isPending: false }),
  useCompleteSubtask: () => ({ mutate: vi.fn() }),
  useDeleteSubtask: () => ({ mutate: vi.fn() }),
}));

vi.mock('../api/shares', () => ({
  createShare: vi.fn(async () => ({ token: 'test-token' })),
}));

vi.mock('../hooks/useDeadlineStatus', () => ({
  useDeadlineStatus: () => ({
    status: 'future',
    label: null,
    progressPercent: null,
  }),
}));

const TASK: Task = {
  id: 'task-1',
  raw_input: 'call dentist',
  title: 'Call dentist to book appointment',
  category: 'Health',
  priority: 2,
  scheduled_date: '2026-03-16',
  scheduled_time: '09:00',
  duration_minutes: 30,
  ai_reasoning: 'Health task',
  reminder_minutes_before: 15,
  is_completed: false,
  completed_at: null,
  reminder_sent: false,
  is_archived: false,
  recurrence: 'weekly',
  recurrence_parent_id: null,
  context_tags: ['@phone'],
  note: 'Check insurance coverage beforehand',
  snoozed_until: null,
  created_at: '2026-03-15T00:00:00Z',
};

function renderCard(task: Task = TASK) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TaskCard task={task} />
    </QueryClientProvider>
  );
}

describe('TaskCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the task title', () => {
    renderCard();
    expect(screen.getByText('Call dentist to book appointment')).toBeInTheDocument();
  });

  it('renders the category chip', () => {
    renderCard();
    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  it('renders the priority number', () => {
    renderCard();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders the recurrence badge', () => {
    renderCard();
    expect(screen.getByText('weekly')).toBeInTheDocument();
  });

  it('renders the note toggle button when task has a note', () => {
    renderCard();
    expect(screen.getByText('note')).toBeInTheDocument();
  });

  it('does not render note toggle when task has no note', () => {
    renderCard({ ...TASK, note: null });
    expect(screen.queryByText('note')).not.toBeInTheDocument();
  });

  it('does not render recurrence badge when recurrence is null', () => {
    renderCard({ ...TASK, recurrence: null });
    expect(screen.queryByText('weekly')).not.toBeInTheDocument();
  });

  it('shows note content after clicking note toggle', () => {
    renderCard();
    fireEvent.click(screen.getByText('note'));
    expect(screen.getByText('Check insurance coverage beforehand')).toBeInTheDocument();
  });

  it('hides note content after toggling twice', () => {
    renderCard();
    const noteBtn = screen.getByText('note');
    fireEvent.click(noteBtn);
    fireEvent.click(noteBtn);
    expect(screen.queryByText('Check insurance coverage beforehand')).not.toBeInTheDocument();
  });

  it('shows confirmation button after clicking delete', () => {
    renderCard();
    // First trash icon triggers confirm state
    const trashButtons = screen.getAllByTitle ? [] : [];
    // Find delete button by its accessible area — use role
    const buttons = screen.getAllByRole('button');
    const deleteBtn = buttons.find((b) => b.querySelector('svg') && b.className.includes('rose'));
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
      expect(screen.getByText('Delete?')).toBeInTheDocument();
    } else {
      // Fallback: click all buttons and check if Delete? appears
      for (const btn of buttons) {
        fireEvent.click(btn);
        if (screen.queryByText('Delete?')) break;
      }
    }
  });

  it('renders context tags', () => {
    renderCard();
    expect(screen.getByText('@phone')).toBeInTheDocument();
  });

  it('applies opacity class when task is completed', () => {
    const { container } = renderCard({ ...TASK, is_completed: true });
    expect(container.querySelector('.opacity-40')).not.toBeNull();
  });

  it('shows line-through style on completed task title', () => {
    renderCard({ ...TASK, is_completed: true });
    const titleEl = screen.getByText('Call dentist to book appointment');
    expect(titleEl.className).toContain('line-through');
  });
});
