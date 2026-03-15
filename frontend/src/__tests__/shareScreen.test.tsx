import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ShareScreen } from '../screens/ShareScreen';

const mockGetShare = vi.fn();
const mockCompleteShare = vi.fn();

vi.mock('../api/shares', () => ({
  getShare: (...args: unknown[]) => mockGetShare(...args),
  completeShare: (...args: unknown[]) => mockCompleteShare(...args),
}));

const SHARE_DATA = {
  share: {
    id: 'share-1',
    task_id: 'task-1',
    token: 'abc123',
    recipient_email: null,
    created_at: '2026-03-15T00:00:00Z',
  },
  task: {
    id: 'task-1',
    title: 'Review project proposal',
    category: 'Work',
    scheduled_date: '2026-03-16',
    scheduled_time: '10:00',
    note: 'Focus on the budget section',
  },
};

function renderShareScreen(token = 'abc123') {
  return render(
    <MemoryRouter initialEntries={[`/share/${token}`]}>
      <Routes>
        <Route path="/share/:token" element={<ShareScreen />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ShareScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task title after loading', async () => {
    mockGetShare.mockResolvedValue(SHARE_DATA);
    renderShareScreen();
    await waitFor(() => expect(screen.getByText('Review project proposal')).toBeInTheDocument());
  });

  it('renders the task category chip', async () => {
    mockGetShare.mockResolvedValue(SHARE_DATA);
    renderShareScreen();
    await waitFor(() => expect(screen.getByText('Work')).toBeInTheDocument());
  });

  it('renders the task note when present', async () => {
    mockGetShare.mockResolvedValue(SHARE_DATA);
    renderShareScreen();
    await waitFor(() => expect(screen.getByText('Focus on the budget section')).toBeInTheDocument());
  });

  it('renders "Mark as Complete" button initially', async () => {
    mockGetShare.mockResolvedValue(SHARE_DATA);
    renderShareScreen();
    await waitFor(() => expect(screen.getByText('Mark as Complete')).toBeInTheDocument());
  });

  it('calls completeShare when Mark as Complete is clicked', async () => {
    mockGetShare.mockResolvedValue(SHARE_DATA);
    mockCompleteShare.mockResolvedValue(undefined);
    renderShareScreen();
    await waitFor(() => expect(screen.getByText('Mark as Complete')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Mark as Complete'));
    await waitFor(() => expect(mockCompleteShare).toHaveBeenCalledWith('abc123'));
  });

  it('shows "Marked as done!" after completing the share', async () => {
    mockGetShare.mockResolvedValue(SHARE_DATA);
    mockCompleteShare.mockResolvedValue(undefined);
    renderShareScreen();
    await waitFor(() => expect(screen.getByText('Mark as Complete')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Mark as Complete'));
    await waitFor(() => expect(screen.getByText('Marked as done!')).toBeInTheDocument());
  });

  it('renders error message when getShare fails', async () => {
    mockGetShare.mockRejectedValue(new Error('Link has expired'));
    renderShareScreen();
    await waitFor(() => expect(screen.getByText('Task not found or link has expired.')).toBeInTheDocument());
  });

  it('renders loader while fetching', () => {
    mockGetShare.mockReturnValue(new Promise(() => {})); // Never resolves
    const { container } = renderShareScreen();
    expect(container.querySelector('.animate-spin')).not.toBeNull();
  });

  it('does not render task content while loading', () => {
    mockGetShare.mockReturnValue(new Promise(() => {}));
    renderShareScreen();
    expect(screen.queryByText('Review project proposal')).not.toBeInTheDocument();
  });
});
