/**
 * Cache service for performance optimization
 * Supports in-memory caching with optional Redis backend
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;
  private keyPrefix: string;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.defaultTTL = options.ttl || 300; // Default 5 minutes
    this.keyPrefix = options.prefix || 'app:';
  }

  /**
   * Generate cache key with prefix
   */
  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Check if entry has expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const cacheKey = this.getKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const cacheKey = this.getKey(key);
    const expiresAt = Date.now() + ((ttl || this.defaultTTL) * 1000);
    this.cache.set(cacheKey, { value, expiresAt });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const cacheKey = this.getKey(key);
    return this.cache.delete(cacheKey);
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const cacheKey = this.getKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Delete multiple keys by pattern
   */
  deletePattern(pattern: string): number {
    const regex = new RegExp(`^${this.keyPrefix}${pattern}`);
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

export function getCacheService(options?: CacheOptions): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService(options);
  }
  return cacheInstance;
}

/**
 * Cache keys used throughout the application
 */
export const CacheKeys = {
  // User data
  USER: (userId: number) => `user:${userId}`,
  USER_SESSION: (userId: number) => `user:session:${userId}`,
  USER_PERMISSIONS: (userId: number) => `user:permissions:${userId}`,

  // Client data
  CLIENT: (clientId: string) => `client:${clientId}`,
  CLIENT_CAMPAIGNS: (clientId: string) => `client:campaigns:${clientId}`,

  // Task data
  TASK: (taskId: string) => `task:${taskId}`,
  TASK_LIST: (userId: number, filters: string) => `tasks:list:${userId}:${filters}`,
  TASK_COMMENTS: (taskId: string) => `task:comments:${taskId}`,

  // Lead data
  LEAD: (leadId: string) => `lead:${leadId}`,
  LEAD_LIST: (userId: number, filters: string) => `leads:list:${userId}:${filters}`,

  // Campaign data
  CAMPAIGN: (campaignId: string) => `campaign:${campaignId}`,
  CAMPAIGN_LIST: (filters: string) => `campaigns:list:${filters}`,

  // Analytics data
  ANALYTICS_METRICS: (clientId: string, period: string) => `analytics:metrics:${clientId}:${period}`,

  // API rate limiting
  RATE_LIMIT: (userId: number, endpoint: string) => `ratelimit:${userId}:${endpoint}`,

  // Email rate limiting
  EMAIL_RATE_LIMIT: (email: string) => `email:ratelimit:${email}`,
};
