interface CacheEntry { data: unknown; ts: number; }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30_000;

export function getDashboardCached(userId: string): unknown | null {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(userId); return null; }
  return entry.data;
}

export function setDashboardCached(userId: string, data: unknown): void {
  cache.set(userId, { data, ts: Date.now() });
}

export function invalidateDashboardCache(userId: string): void {
  cache.delete(userId);
}
