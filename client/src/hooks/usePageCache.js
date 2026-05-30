import { useState, useEffect, useCallback, useRef } from 'react';

const cache = new Map();

export function invalidatePageCache(key) {
  if (key) cache.delete(key);
  else cache.clear();
}

export function usePageCache(key, fetchFn) {
  const cached = cache.get(key);
  const [data, setDataState] = useState(cached?.data ?? null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(cached?.error ?? false);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const setData = useCallback((updater) => {
    setDataState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      cache.set(key, { data: next, error: false });
      return next;
    });
    setError(false);
  }, [key]);

  const load = useCallback(async ({ force = false } = {}) => {
    const existing = cache.get(key);

    if (existing && !force) {
      setDataState(existing.data);
      setError(existing.error ?? false);
      setLoading(false);

      try {
        const fresh = await fetchRef.current();
        cache.set(key, { data: fresh, error: false });
        setDataState(fresh);
        setError(false);
      } catch {
        // Keep showing cached data if background refresh fails.
      }
      return existing.data;
    }

    if (!existing) setLoading(true);
    setError(false);

    try {
      const fresh = await fetchRef.current();
      cache.set(key, { data: fresh, error: false });
      setDataState(fresh);
      setError(false);
      return fresh;
    } catch {
      cache.set(key, { data: existing?.data ?? null, error: true });
      setError(true);
      if (!existing) setDataState(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => load({ force: true }), [load]);

  return { data, loading, error, refetch, setData };
}
