/**
 * Simple in-memory cache for client-side queries (TTL-based)
 * Keeps category feeds and repeated video queries instant when switching tabs.
 */
class MemoryCache {
  constructor(defaultTtlMs = 2 * 60 * 1000, maxEntries = 50) {
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key, data, ttlMs = this.defaultTtlMs) {
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }
}

export const queryCache = new MemoryCache();
