// cacheUtils.ts - Caching utilities for performance optimization

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  /**
   * Get cached data if valid
   */
  get(key: string): T | null {
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
   */
  set(key: string, data: T, ttlMs: number): void {
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
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

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
   */
  getStats(): { size: number; maxEntries: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
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
} as const;

// Global cache instances
export const ipinfoCache = new MemoryCache<any>(500);
export const enhancedCache = new MemoryCache<any>(200);

/**
 * Generate cache key for IP-based requests
 */
export function generateCacheKey(prefix: string, ip: string, additionalParams: string = ''): string {
  return `${prefix}:${ip}${additionalParams ? ':' + additionalParams : ''}`;
}

/**
 * Get cached response with automatic JSON parsing
 */
export function getCachedResponse<T>(cache: MemoryCache<T>, key: string): T | null {
  return cache.get(key);
}

/**
 * Set cached response with automatic JSON stringification
 */
export function setCachedResponse<T>(
  cache: MemoryCache<T>, 
  key: string, 
  data: T, 
  ttl: number
): void {
  cache.set(key, data, ttl);
}

/**
 * Middleware to add caching headers to responses
 */
export function addCacheHeaders(response: Response, maxAge: number): Response {
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
 */
export async function cachedFetch<T>(
  cache: MemoryCache<T>,
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<T> {
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