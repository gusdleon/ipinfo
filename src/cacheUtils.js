// cacheUtils.js - Caching utilities for performance optimization

/**
 * @typedef {Object} CacheEntry
 * @property {*} data - Cached data
 * @property {number} timestamp - Cache timestamp
 * @property {number} ttl - Time to live in milliseconds
 */

export class MemoryCache {
  /**
   * @param {number} [maxEntries=1000] - Maximum cache entries
   */
  constructor(maxEntries = 1000) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
  }

  /**
   * Get cached data if valid
   * @param {string} key - Cache key
   * @returns {*|null} Cached data or null
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data with TTL
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttlMs - TTL in milliseconds
   */
  set(key, data, ttlMs) {
    // Cleanup old entries if cache is full
    if (this.cache.size >= this.maxEntries) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  /**
   * Delete a specific cache entry
   * @param {string} key - Cache key
   * @returns {boolean} True if deleted
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    // If still too many entries, remove oldest ones
    if (this.cache.size >= this.maxEntries) {
      const entries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.maxEntries * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries
    };
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }
}

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  ENHANCED_IP: 5 * 60 * 1000,      // 5 minutes
  GEOLOCATION: 10 * 60 * 1000,     // 10 minutes
  SECURITY: 5 * 60 * 1000,         // 5 minutes
  NETWORK: 60 * 60 * 1000,         // 1 hour
  IPINFO_DATA: 10 * 60 * 1000,     // 10 minutes
};

// Global cache instances
export const ipinfoCache = new MemoryCache(500);
export const enhancedCache = new MemoryCache(200);

/**
 * Generate cache key for IP-based requests
 * @param {string} prefix - Key prefix
 * @param {string} ip - IP address
 * @param {string} [additionalParams=''] - Additional parameters
 * @returns {string} Cache key
 */
export function generateCacheKey(prefix, ip, additionalParams = '') {
  return `${prefix}:${ip}${additionalParams ? ':' + additionalParams : ''}`;
}

/**
 * Get cached response with automatic JSON parsing
 * @param {MemoryCache} cache - Cache instance
 * @param {string} key - Cache key
 * @returns {*|null} Cached data or null
 */
export function getCachedResponse(cache, key) {
  return cache.get(key);
}

/**
 * Set cached response with automatic JSON stringification
 * @param {MemoryCache} cache - Cache instance
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} ttl - TTL in milliseconds
 */
export function setCachedResponse(cache, key, data, ttl) {
  cache.set(key, data, ttl);
}

/**
 * Middleware to add caching headers to responses
 * @param {Response} response - Original response
 * @param {number} maxAge - Max age in milliseconds
 * @returns {Response} Response with cache headers
 */
export function addCacheHeaders(response, maxAge) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', `public, max-age=${Math.floor(maxAge / 1000)}`);
  headers.set('Expires', new Date(Date.now() + maxAge).toUTCString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Create cache-aware fetch wrapper
 * @param {MemoryCache} cache - Cache instance
 * @param {string} cacheKey - Cache key
 * @param {Function} fetchFn - Function that fetches fresh data
 * @param {number} ttl - TTL in milliseconds
 * @returns {Promise<*>} Cached or fresh data
 */
export async function cachedFetch(cache, cacheKey, fetchFn, ttl) {
  // Try to get from cache first
  const cached = cache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Cache the result
  cache.set(cacheKey, data, ttl);
  
  return data;
}