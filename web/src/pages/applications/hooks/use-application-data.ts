import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

import { services } from '@/services';
import type { Application as App } from '@/types/application';
import { PAGE_SIZE } from '../constants';

export const useApplicationData = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true); // Start with true
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchPage = useCallback(async (cursor: string | null = null, filter?: string) => {
    setLoading(true);
    setError(false);

    try {
      const resp = await services.application.list({
        filter: filter ? `field['name']~='${filter}'` : undefined,
        pageSize: PAGE_SIZE,
        pageToken: cursor || undefined,
      });

      setApps((prev) => (cursor ? [...prev, ...resp.applications] : resp.applications));
      setNextCursor(resp.nextPageToken ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const debouncedSearch = useMemo(() => debounce((term: string) => fetchPage(null, term), 500), [fetchPage]);

  const handleSearch = useCallback(() => {
    fetchPage(null, search.trim());
  }, [search, fetchPage]);

  // Initial load
  useEffect(() => {
    fetchPage(null);
  }, []); // Only run once on mount

  useEffect(() => {
    if (isInitialized) {
      // Only run search after initial load
      debouncedSearch(search.trim());
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [search, debouncedSearch, isInitialized]);

  return {
    apps,
    loading,
    error,
    nextCursor,
    search,
    setSearch,
    fetchPage,
    handleSearch,
    isInitialized,
  };
};
