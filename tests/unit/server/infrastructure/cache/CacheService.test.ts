import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService, getCacheService, CacheKeys } from '../../../../../server/infrastructure/cache/CacheService';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService({ ttl: 1, prefix: 'test:' });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('initialization', () => {
    it('should create cache instance with default options', () => {
      const defaultCache = new CacheService();
      expect(defaultCache).toBeInstanceOf(CacheService);
    });

    it('should use custom TTL when provided', () => {
      const customCache = new CacheService({ ttl: 60 });
      expect(customCache).toBeInstanceOf(CacheService);
    });

    it('should use custom prefix when provided', () => {
      const customCache = new CacheService({ prefix: 'custom:' });
      expect(customCache).toBeInstanceOf(CacheService);
    });
  });

  describe('get', () => {
    it('should return null for non-existent key', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return cached value', () => {
      cache.set('test-key', 'test-value');
      const result = cache.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should handle different value types', () => {
      const stringValue = 'string-value';
      const numberValue = 123;
      const objectValue = { nested: { value: true } };
      const arrayValue = [1, 2, 3];

      cache.set('string-key', stringValue);
      cache.set('number-key', numberValue);
      cache.set('object-key', objectValue);
      cache.set('array-key', arrayValue);

      expect(cache.get('string-key')).toBe(stringValue);
      expect(cache.get('number-key')).toBe(numberValue);
      expect(cache.get('object-key')).toEqual(objectValue);
      expect(cache.get('array-key')).toEqual(arrayValue);
    });
  });

  describe('set', () => {
    it('should store value with default TTL', () => {
      cache.set('test-key', 'test-value');
      const result = cache.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should store value with custom TTL', () => {
      const cacheWithTTL = new CacheService({ ttl: 10 });
      cacheWithTTL.set('test-key', 'test-value', 5);
      const result = cacheWithTTL.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should overwrite existing value', () => {
      cache.set('test-key', 'value1');
      cache.set('test-key', 'value2');
      const result = cache.get('test-key');
      expect(result).toBe('value2');
    });
  });

  describe('delete', () => {
    it('should remove value from cache', () => {
      cache.set('test-key', 'test-value');
      cache.delete('test-key');
      const result = cache.get('test-key');
      expect(result).toBeNull();
    });

    it('should return false for non-existent key', () => {
      const result = cache.delete('non-existent');
      expect(result).toBe(false);
    });

    it('should return true when key exists', () => {
      cache.set('test-key', 'test-value');
      const result = cache.delete('test-key');
      expect(result).toBe(true);
    });
  });

  describe('has', () => {
    it('should return false for non-existent key', () => {
      const result = cache.has('non-existent');
      expect(result).toBe(false);
    });

    it('should return true for existing key', () => {
      cache.set('test-key', 'test-value');
      const result = cache.has('test-key');
      expect(result).toBe(true);
    });

    it('should return false for expired entry', async () => {
      const shortTTLCache = new CacheService({ ttl: 0.1 }); // 100ms TTL
      shortTTLCache.set('test-key', 'test-value');

      // Wait for entry to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const result = shortTTLCache.has('test-key');
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.getStats().size).toBe(3);

      cache.clear();

      expect(cache.getStats().size).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      cache.set('test-key', 'cached-value');
      const factory = vi.fn(async () => 'factory-value');

      const result = await cache.getOrSet('test-key', factory);

      expect(result).toBe('cached-value');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result', async () => {
      const factory = vi.fn(async () => 'factory-value');

      const result = await cache.getOrSet('test-key', factory);

      expect(result).toBe('factory-value');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cache.get('test-key')).toBe('factory-value');
    });

    it('should use custom TTL for factory result', async () => {
      const cacheWithTTL = new CacheService({ ttl: 10 });
      const factory = vi.fn(async () => 'factory-value');

      await cacheWithTTL.getOrSet('test-key', factory, 5);

      // Wait for expiration (5s TTL + 1s buffer)
      await new Promise((resolve) => setTimeout(resolve, 6000));

      const result = cacheWithTTL.get('test-key');
      expect(result).toBeNull(); // Should be expired
    }, 10000); // Increase test timeout to 10s
  });

  describe('deletePattern', () => {
    it('should delete keys matching pattern', () => {
      cache.set('user:1', 'value1');
      cache.set('user:2', 'value2');
      cache.set('user:3', 'value3');
      cache.set('admin:1', 'value4');
      cache.set('admin:2', 'value5');

      expect(cache.getStats().size).toBe(5);

      const deleted = cache.deletePattern('user:*');

      expect(deleted).toBe(3);
      expect(cache.getStats().size).toBe(2);
      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('user:2')).toBeNull();
      expect(cache.get('user:3')).toBeNull();
      expect(cache.get('admin:1')).toBe('value4');
      expect(cache.get('admin:2')).toBe('value5');
    });

    it('should delete all keys with wildcard', () => {
      cache.set('user:1', 'value1');
      cache.set('user:2', 'value2');

      const deleted = cache.deletePattern('*');

      expect(deleted).toBe(2);
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      const shortTTLCache = new CacheService({ ttl: 0.1 }); // 100ms TTL
      shortTTLCache.set('key1', 'value1');
      shortTTLCache.set('key2', 'value2');
      shortTTLCache.set('key3', 'value3');

      expect(shortTTLCache.getStats().size).toBe(3);

      // Wait for entries to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const cleaned = shortTTLCache.cleanup();

      expect(cleaned).toBe(3);
      expect(shortTTLCache.getStats().size).toBe(0);
    });

    it('should keep non-expired entries', async () => {
      const longTTLCache = new CacheService({ ttl: 10 }); // 10s TTL
      longTTLCache.set('key1', 'value1');
      longTTLCache.set('key2', 'value2');

      expect(longTTLCache.getStats().size).toBe(2);

      // Wait a bit but not full TTL
      await new Promise((resolve) => setTimeout(resolve, 100));

      const cleaned = longTTLCache.cleanup();

      expect(cleaned).toBe(0);
      expect(longTTLCache.getStats().size).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const stats = cache.getStats();

      expect(stats.size).toBe(3);
      expect(stats.keys.length).toBe(3);
      expect(stats.keys).toContain('test:key1');
      expect(stats.keys).toContain('test:key2');
      expect(stats.keys).toContain('test:key3');
    });

    it('should return empty stats for empty cache', () => {
      const stats = cache.getStats();

      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe('key prefix', () => {
    it('should add prefix to all keys', () => {
      const prefixedCache = new CacheService({ prefix: 'app:' });

      prefixedCache.set('user:1', 'value1');
      prefixedCache.set('user:2', 'value2');

      const stats = prefixedCache.getStats();

      expect(stats.keys).toContain('app:user:1');
      expect(stats.keys).toContain('app:user:2');
    });
  });

  describe('CacheKeys', () => {
    it('should generate user cache keys', () => {
      expect(CacheKeys.USER(123)).toBe('user:123');
      expect(CacheKeys.USER_SESSION(123)).toBe('user:session:123');
      expect(CacheKeys.USER_PERMISSIONS(123)).toBe('user:permissions:123');
    });

    it('should generate client cache keys', () => {
      expect(CacheKeys.CLIENT('client-123')).toBe('client:client-123');
      expect(CacheKeys.CLIENT_CAMPAIGNS('client-123')).toBe('client:campaigns:client-123');
    });

    it('should generate task cache keys', () => {
      expect(CacheKeys.TASK('task-123')).toBe('task:task-123');
      expect(CacheKeys.TASK_LIST(123, 'all')).toBe('tasks:list:123:all');
      expect(CacheKeys.TASK_COMMENTS('task-123')).toBe('task:comments:task-123');
    });

    it('should generate lead cache keys', () => {
      expect(CacheKeys.LEAD('lead-123')).toBe('lead:lead-123');
      expect(CacheKeys.LEAD_LIST(123, 'active')).toBe('leads:list:123:active');
    });

    it('should generate campaign cache keys', () => {
      expect(CacheKeys.CAMPAIGN('campaign-123')).toBe('campaign:campaign-123');
      expect(CacheKeys.CAMPAIGN_LIST('all')).toBe('campaigns:list:all');
    });

    it('should generate analytics cache keys', () => {
      expect(CacheKeys.ANALYTICS_METRICS('client-123', 'monthly')).toBe('analytics:metrics:client-123:monthly');
    });

    it('should generate rate limit cache keys', () => {
      expect(CacheKeys.RATE_LIMIT(123, 'api')).toBe('ratelimit:123:api');
      expect(CacheKeys.EMAIL_RATE_LIMIT('test@example.com')).toBe('email:ratelimit:test@example.com');
    });
  });

  describe('singleton', () => {
    beforeEach(() => {
      // Reset singleton
      (getCacheService as any).cacheInstance = null;
    });

    it('should return same instance on subsequent calls', () => {
      const instance1 = getCacheService();
      const instance2 = getCacheService();

      expect(instance1).toBe(instance2);
    });
  });
});
