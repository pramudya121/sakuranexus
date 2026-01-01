import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}

const cache = new Map<string, CacheEntry<any>>();

// Generic data fetching hook with caching
export function useDataCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cached = cache.get(key);
    const now = Date.now();

    // Return cached data if valid and not forcing refresh
    if (cached && !forceRefresh) {
      const isExpired = now > cached.expiresAt;
      
      if (!isExpired) {
        setData(cached.data);
        setIsLoading(false);
        setIsStale(false);
        return cached.data;
      }

      // Stale while revalidate: return stale data while fetching fresh
      if (staleWhileRevalidate && cached.data) {
        setData(cached.data);
        setIsStale(true);
        setIsLoading(false);
      }
    }

    try {
      setIsLoading(cached ? false : true);
      const freshData = await fetcherRef.current();
      
      // Update cache
      cache.set(key, {
        data: freshData,
        timestamp: now,
        expiresAt: now + ttl,
      });

      setData(freshData);
      setIsStale(false);
      setError(null);
      return freshData;
    } catch (err) {
      setError(err as Error);
      // Return stale data on error if available
      if (cached?.data) {
        setData(cached.data);
        setIsStale(true);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [key, ttl, staleWhileRevalidate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  const invalidate = useCallback(() => {
    cache.delete(key);
  }, [key]);

  return {
    data,
    isLoading,
    error,
    isStale,
    refresh,
    invalidate,
  };
}

// Prefetch data into cache
export async function prefetchData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 5 * 60 * 1000
): Promise<T> {
  const data = await fetcher();
  const now = Date.now();
  
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  });

  return data;
}

// Clear all cache
export function clearCache(): void {
  cache.clear();
}

// Clear specific cache entry
export function clearCacheEntry(key: string): void {
  cache.delete(key);
}

// Get cache stats
export function getCacheStats() {
  const entries = Array.from(cache.entries());
  const now = Date.now();
  
  return {
    size: cache.size,
    entries: entries.map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      isExpired: now > entry.expiresAt,
      expiresIn: Math.max(0, entry.expiresAt - now),
    })),
  };
}

// Infinite scroll data hook
export function useInfiniteData<T>(
  keyPrefix: string,
  fetcher: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: CacheOptions & { pageSize?: number } = {}
) {
  const { pageSize = 20, ...cacheOptions } = options;
  const [pages, setPages] = useState<T[][]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadPage = useCallback(async (page: number) => {
    const cacheKey = `${keyPrefix}_page_${page}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now < cached.expiresAt) {
      return cached.data;
    }

    const result = await fetcher(page);
    
    cache.set(cacheKey, {
      data: result,
      timestamp: now,
      expiresAt: now + (cacheOptions.ttl || 5 * 60 * 1000),
    });

    return result;
  }, [keyPrefix, fetcher, cacheOptions.ttl]);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await loadPage(0);
      setPages([result.data]);
      setHasMore(result.hasMore);
      setCurrentPage(0);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
    setIsLoading(false);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await loadPage(nextPage);
      setPages((prev) => [...prev, result.data]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Failed to load more data:', error);
    }
    setIsLoadingMore(false);
  }, [currentPage, hasMore, isLoadingMore, loadPage]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const allItems = pages.flat();

  return {
    items: allItems,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh: loadInitial,
  };
}

export default useDataCache;
