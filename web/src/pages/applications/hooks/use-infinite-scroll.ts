import { useEffect } from 'react';

type InfiniteScrollProps = {
  loadMoreRef: React.RefObject<HTMLDivElement | null>; // Allow null
  nextCursor: string | null;
  loading: boolean;
  fetchPage: (cursor: string | null, filter?: string) => Promise<void>;
};

export const useInfiniteScroll = ({ loadMoreRef, nextCursor, loading, fetchPage }: InfiniteScrollProps) => {
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && nextCursor && !loading) {
          fetchPage(nextCursor);
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMoreRef, nextCursor, loading, fetchPage]);
};
