import { useState, useCallback } from 'react';

import { services } from '@/services';
import type { Variable as Var } from '@/types/variable';

export const useVariableData = () => {
  const [variables, setVariables] = useState<Var[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(false);
  const [, setNextCursor] = useState<string | null>(null);

  const fetchPage = useCallback(async (cursor: string | null = null, filter?: string) => {
    setLoading(true);
    setError(false);

    try {
      const resp = await services.variable.list({
        filter: filter ? `field['key']~='${filter}'` : undefined,
        pageToken: cursor || undefined,
      });

      setVariables((prev) => (cursor ? [...prev, ...resp.items] : resp.items));
      setNextCursor(resp.nextPageToken ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

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
    fetchPage,
    fetchAllVariables,
    isInitialized,
  };
};
