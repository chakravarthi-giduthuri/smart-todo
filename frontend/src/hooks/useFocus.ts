import { useState } from 'react';
import { getFocusTask } from '../api/focus';
import type { FocusResponse } from '../types/api';

export function useFocus() {
  const [data, setData] = useState<FocusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchFocus() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getFocusTask();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get focus task');
    } finally {
      setIsLoading(false);
    }
  }

  function clear() { setData(null); setError(null); }

  return { data, isLoading, error, fetchFocus, clear };
}
