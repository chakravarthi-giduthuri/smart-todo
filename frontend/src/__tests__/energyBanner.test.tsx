import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnergyBanner } from '../components/home/EnergyBanner';

const mockSubmit = vi.fn();

vi.mock('../hooks/useEnergy', () => ({
  useTodayEnergy: vi.fn(),
  useSubmitEnergy: vi.fn(() => ({ mutate: mockSubmit, isPending: false })),
}));

function renderBanner() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <EnergyBanner />
    </QueryClientProvider>
  );
}

describe('EnergyBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders check-in prompt when no energy data exists', async () => {
    const { useTodayEnergy } = await import('../hooks/useEnergy') as any;
    useTodayEnergy.mockReturnValue({ data: null, isLoading: false });
    renderBanner();
    expect(screen.getByText("How's your energy today?")).toBeInTheDocument();
  });

  it('renders all three energy level buttons when not checked in', async () => {
    const { useTodayEnergy } = await import('../hooks/useEnergy') as any;
    useTodayEnergy.mockReturnValue({ data: null, isLoading: false });
    renderBanner();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('calls submit with "high" when High button is clicked', async () => {
    const { useTodayEnergy } = await import('../hooks/useEnergy') as any;
    useTodayEnergy.mockReturnValue({ data: null, isLoading: false });
    renderBanner();
    fireEvent.click(screen.getByText('High'));
    expect(mockSubmit).toHaveBeenCalledWith('high');
  });

  it('calls submit with "medium" when Medium button is clicked', async () => {
    const { useTodayEnergy } = await import('../hooks/useEnergy') as any;
    useTodayEnergy.mockReturnValue({ data: null, isLoading: false });
    renderBanner();
    fireEvent.click(screen.getByText('Medium'));
    expect(mockSubmit).toHaveBeenCalledWith('medium');
  });

  it('calls submit with "low" when Low button is clicked', async () => {
    const { useTodayEnergy } = await import('../hooks/useEnergy') as any;
    useTodayEnergy.mockReturnValue({ data: null, isLoading: false });
    renderBanner();
    fireEvent.click(screen.getByText('Low'));
    expect(mockSubmit).toHaveBeenCalledWith('low');
  });

  it('shows "High energy day" label when energy level is high', async () => {
    const { useTodayEnergy } = await import('../hooks/useEnergy') as any;
    useTodayEnergy.mockReturnValue({ data: { level: 'high' }, isLoading: false });
    renderBanner();
    expect(screen.getByText('High energy day')).toBeInTheDocument();
  });

  it('shows "Steady energy day" label when energy level is medium', async () => {
    const { useTodayEnergy } = await import('../hooks/useEnergy') as any;
    useTodayEnergy.mockReturnValue({ data: { level: 'medium' }, isLoading: false });
    renderBanner();
    expect(screen.getByText('Steady energy day')).toBeInTheDocument();
  });

  it('shows "Low energy day" label when energy level is low', async () => {
    const { useTodayEnergy } = await import('../hooks/useEnergy') as any;
    useTodayEnergy.mockReturnValue({ data: { level: 'low' }, isLoading: false });
    renderBanner();
    expect(screen.getByText('Low energy day')).toBeInTheDocument();
  });

  it('renders nothing when isLoading is true', async () => {
    const { useTodayEnergy } = await import('../hooks/useEnergy') as any;
    useTodayEnergy.mockReturnValue({ data: null, isLoading: true });
    const { container } = renderBanner();
    expect(container.firstChild).toBeNull();
  });

  it('shows AI usage note when already checked in', async () => {
    const { useTodayEnergy } = await import('../hooks/useEnergy') as any;
    useTodayEnergy.mockReturnValue({ data: { level: 'high' }, isLoading: false });
    renderBanner();
    expect(screen.getByText('AI is using this to schedule tasks')).toBeInTheDocument();
  });
});
