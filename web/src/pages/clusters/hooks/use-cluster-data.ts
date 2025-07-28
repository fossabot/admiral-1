import { useState, useCallback } from 'react';

import { services } from '@/services';
import type { Cluster } from '@/types/cluster';

export const useClusterData = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(false);

  const fetchAllClusters = useCallback(async (filter?: string) => {
    setClusters([]);
    let currentCursor: string | null = null;
    setLoading(true);

    try {
      do {
        const resp = await services.cluster.list({
          filter: filter ? `field['name']~='${filter}'` : undefined,
          pageToken: currentCursor || undefined,
        });

        setClusters((prev) => [...prev, ...resp.items]);
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
    clusters,
    loading,
    error,
    fetchAllClusters,
    isInitialized,
  };
};
