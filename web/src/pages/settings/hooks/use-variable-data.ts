import { useState, useCallback } from 'react';

import { services } from '@/services';
import type { Variable as Var } from '@/types/variable';

export const useVariableData = () => {
  const [variables, setVariables] = useState<Var[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(false);

  const fetchAllVariables = useCallback(async (filter?: string) => {
    setVariables([]);
    let currentCursor: string | null = null;
    setLoading(true);

    try {
      do {
        const resp = await services.variable.list({
          filter: filter ? `field['key']~='${filter}'` : undefined,
          pageToken: currentCursor || undefined,
        });

        setVariables((prev) => [...prev, ...resp.items]);
        currentCursor = resp.nextPageToken ?? null;
      } while (currentCursor);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  return {
    variables,
    loading,
    error,
    fetchAllVariables,
    isInitialized,
  };
};
