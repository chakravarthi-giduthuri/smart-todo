import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubtaskList } from '../components/tasks/SubtaskList';
import type { Subtask } from '../types/task';

const SUBTASKS: Subtask[] = [
  { id: 's1', task_id: 'task-1', title: 'Research options', is_completed: false, position: 0, created_at: '2026-03-15T00:00:00Z' },
  { id: 's2', task_id: 'task-1', title: 'Write draft', is_completed: true, position: 1, created_at: '2026-03-15T00:00:00Z' },
];

const mockAddSubtask = vi.fn();
const mockCompleteSubtask = vi.fn();
const mockDeleteSubtask = vi.fn();

vi.mock('../hooks/useTasks', () => ({
  useSubtasks: vi.fn(() => ({ data: SUBTASKS, isLoading: false })),
  useAddSubtask: vi.fn(() => ({ mutate: mockAddSubtask, isPending: false })),
  useCompleteSubtask: vi.fn(() => ({ mutate: mockCompleteSubtask })),
  useDeleteSubtask: vi.fn(() => ({ mutate: mockDeleteSubtask })),
}));

function renderSubtaskList(taskId = 'task-1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SubtaskList taskId={taskId} />
    </QueryClientProvider>
  );
}

describe('SubtaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all subtask titles', () => {
    renderSubtaskList();
    expect(screen.getByText('Research options')).toBeInTheDocument();
    expect(screen.getByText('Write draft')).toBeInTheDocument();
  });

  it('renders subtask progress counter', () => {
    renderSubtaskList();
    expect(screen.getByText('Subtasks 1/2')).toBeInTheDocument();
  });

  it('renders add subtask input field', () => {
    renderSubtaskList();
    expect(screen.getByPlaceholderText('Add subtask...')).toBeInTheDocument();
  });

  it('calls addSubtask when form is submitted via Enter key', () => {
    renderSubtaskList();
    const input = screen.getByPlaceholderText('Add subtask...');
    fireEvent.change(input, { target: { value: 'New subtask item' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockAddSubtask).toHaveBeenCalledWith('New subtask item', expect.any(Object));
  });

  it('does not call addSubtask when input is empty', () => {
    renderSubtaskList();
    const input = screen.getByPlaceholderText('Add subtask...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockAddSubtask).not.toHaveBeenCalled();
  });

  it('applies line-through style on completed subtask', () => {
    renderSubtaskList();
    const completedTitle = screen.getByText('Write draft');
    expect(completedTitle.className).toContain('line-through');
  });

  it('renders loading pulse when isLoading is true', async () => {
    const mod = await import('../hooks/useTasks') as any;
    mod.useSubtasks.mockReturnValueOnce({ data: [], isLoading: true });
    const { container } = renderSubtaskList();
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('renders empty state with only the add input when no subtasks', async () => {
    const mod = await import('../hooks/useTasks') as any;
    mod.useSubtasks.mockReturnValueOnce({ data: [], isLoading: false });
    renderSubtaskList();
    expect(screen.queryByText(/Subtasks/)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add subtask...')).toBeInTheDocument();
  });
});
