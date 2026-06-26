/**
 * Lightweight localStorage cache with TTL.
 * Used by mobile screens to serve stale data while re-fetching in background.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number; // epoch ms
}

/**
 * Write data to cache.
 * @param key    Cache key (e.g. 'notices', 'resources')
 * @param data   Any JSON-serialisable value
 * @param ttlMin Time-to-live in minutes (default 30)
 */
export function setCache<T>(key: string, data: T, ttlMin = 30): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMin * 60 * 1000,
    };
    localStorage.setItem(`tgpcop_cache_${key}`, JSON.stringify(entry));
  } catch {
    // Storage quota exceeded or private browsing — silently ignore
  }
}

/**
 * Read data from cache.
 * Returns null if the entry is missing or expired.
 */
export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`tgpcop_cache_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(`tgpcop_cache_${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Manually evict a cache entry.
 */
export function clearCache(key: string): void {
  try {
    localStorage.removeItem(`tgpcop_cache_${key}`);
  } catch {
    // ignore
  }
}

/**
 * Clear ALL tgpcop cache entries.
 */
export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith('tgpcop_cache_')
    );
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
