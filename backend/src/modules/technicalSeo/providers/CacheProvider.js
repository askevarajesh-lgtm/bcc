/**
 * CacheProvider
 * Abstract cache provider for storing temporary state, summaries, and scores.
 * Defaults to MemoryCache, can be extended for Redis in the future.
 */

class CacheProvider {
  constructor() {
    // Basic memory cache: Map<key, { value, expiresAt }>
    this.memoryCache = new Map();
  }

  /**
   * Set a value in the cache.
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlSeconds 
   */
  async set(key, value, ttlSeconds = 3600) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.memoryCache.set(key, { value, expiresAt });
  }

  /**
   * Get a value from the cache.
   * @param {string} key 
   * @returns {any} value or null
   */
  async get(key) {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete a value from the cache.
   * @param {string} key 
   */
  async delete(key) {
    this.memoryCache.delete(key);
  }

  /**
   * Clear all cached values (e.g., matching a namespace pattern, mock implementation).
   * @param {string} prefix 
   */
  async clearPrefix(prefix) {
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Export a singleton instance for shared memory cache across the app
const cacheInstance = new CacheProvider();
module.exports = cacheInstance;
