import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FocusModeButton } from '../components/home/FocusModeButton';
import type { Task } from '../types/task';

const mockFetchFocus = vi.fn();
const mockClear = vi.fn();

vi.mock('../hooks/useFocus', () => ({
  useFocus: vi.fn(),
}));

const TASKS: Task[] = [
  {
    id: 'task-1',
    raw_input: 'write report',
    title: 'Write quarterly report',
    category: 'Work',
    priority: 1,
    scheduled_date: '2026-03-15',
    scheduled_time: '09:00',
    duration_minutes: 120,
    ai_reasoning: 'High priority',
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
  },
];

function renderButton(tasks: Task[] = TASKS) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <FocusModeButton tasks={tasks} />
    </QueryClientProvider>
  );
}

describe('FocusModeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "What should I do now?" button when no focus data', async () => {
    const { useFocus } = await import('../hooks/useFocus') as any;
    useFocus.mockReturnValue({ data: null, isLoading: false, error: null, fetchFocus: mockFetchFocus, clear: mockClear });
    renderButton();
    expect(screen.getByText('What should I do now?')).toBeInTheDocument();
  });

  it('calls fetchFocus when button is clicked', async () => {
    const { useFocus } = await import('../hooks/useFocus') as any;
    useFocus.mockReturnValue({ data: null, isLoading: false, error: null, fetchFocus: mockFetchFocus, clear: mockClear });
    renderButton();
    fireEvent.click(screen.getByText('What should I do now?'));
    expect(mockFetchFocus).toHaveBeenCalledTimes(1);
  });

  it('shows "Thinking..." when isLoading is true', async () => {
    const { useFocus } = await import('../hooks/useFocus') as any;
    useFocus.mockReturnValue({ data: null, isLoading: true, error: null, fetchFocus: mockFetchFocus, clear: mockClear });
    renderButton();
    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });

  it('shows focus task title after fetchFocus resolves', async () => {
    const { useFocus } = await import('../hooks/useFocus') as any;
    useFocus.mockReturnValue({
      data: { task: TASKS[0], reason: 'Most urgent task right now' },
      isLoading: false,
      error: null,
      fetchFocus: mockFetchFocus,
      clear: mockClear,
    });
    renderButton();
    expect(screen.getByText('Write quarterly report')).toBeInTheDocument();
  });

  it('shows focus reason after fetchFocus resolves', async () => {
    const { useFocus } = await import('../hooks/useFocus') as any;
    useFocus.mockReturnValue({
      data: { task: TASKS[0], reason: 'Most urgent task right now' },
      isLoading: false,
      error: null,
      fetchFocus: mockFetchFocus,
      clear: mockClear,
    });
    renderButton();
    expect(screen.getByText('Most urgent task right now')).toBeInTheDocument();
  });

  it('shows error message when error is present', async () => {
    const { useFocus } = await import('../hooks/useFocus') as any;
    useFocus.mockReturnValue({ data: null, isLoading: false, error: 'Network error', fetchFocus: mockFetchFocus, clear: mockClear });
    renderButton();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('button is disabled when no incomplete tasks', async () => {
    const { useFocus } = await import('../hooks/useFocus') as any;
    useFocus.mockReturnValue({ data: null, isLoading: false, error: null, fetchFocus: mockFetchFocus, clear: mockClear });
    renderButton([]);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('calls clear when X button is clicked', async () => {
    const { useFocus } = await import('../hooks/useFocus') as any;
    useFocus.mockReturnValue({
      data: { task: TASKS[0], reason: 'Most urgent task' },
      isLoading: false,
      error: null,
      fetchFocus: mockFetchFocus,
      clear: mockClear,
    });
    renderButton();
    // Find close button
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find((b) => b.textContent === '' || b.title === '');
    if (closeBtn) fireEvent.click(closeBtn);
    expect(mockClear).toHaveBeenCalled();
  });
});
