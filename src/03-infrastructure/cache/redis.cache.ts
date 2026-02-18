// Redis Cache Service - Distributed caching layer for Prisma queries
import IORedis from 'ioredis';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RedisClientType = any;

export interface CacheService {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  clear(): Promise<void>;
  isConnected(): boolean;
}

class RedisCacheService implements CacheService {
  private client: RedisClientType | null = null;
  private connected = false;
  private readonly defaultTTL: number;

  constructor() {
    this.defaultTTL = parseInt(process.env.PRISMA_QUERY_CACHE_TTL || '60', 10);

    // Only initialize Redis if URL is provided
    if (process.env.REDIS_URL) {
      this.initializeRedis();
    } else {
      console.log('ℹ️  Redis not configured, using in-memory cache only');
    }
  }

  private initializeRedis() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.client = new (IORedis as any)(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.warn(
              '⚠️  Redis connection failed, falling back to in-memory cache'
            );
            return null; // Stop retrying
          }
          return Math.min(times * 100, 2000); // Exponential backoff
        },
        reconnectOnError: (err: Error) => {
          console.error('Redis connection error:', err.message);
          return false; // Don't reconnect on errors
        },
        lazyConnect: true, // Don't connect immediately
        enableOfflineQueue: false // Don't queue commands when offline
      });

      this.client.on('connect', () => {
        this.connected = true;
        console.log('✅ Redis cache connected');
      });

      this.client.on('error', (error: Error) => {
        this.connected = false;
        console.warn('⚠️  Redis error:', error.message);
      });

      this.client.on('close', () => {
        this.connected = false;
      });

      // Attempt connection
      this.client.connect().catch((error: Error) => {
        console.warn('⚠️  Redis connection failed:', error.message);
        this.connected = false;
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.client = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  async get(key: string): Promise<any | null> {
    if (!this.isConnected()) return null;

    try {
      const data = await this.client!.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.warn('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected()) return;

    try {
      const ttl = ttlSeconds ?? this.defaultTTL;
      const serialized = JSON.stringify(value);
      await this.client!.setex(key, ttl, serialized);
    } catch (error) {
      console.warn('Redis set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected()) return;

    try {
      await this.client!.del(key);
    } catch (error) {
      console.warn('Redis del error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.isConnected()) return;

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(...keys);
      }
    } catch (error) {
      console.warn('Redis deletePattern error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.isConnected()) return;

    try {
      await this.client!.flushdb();
    } catch (error) {
      console.warn('Redis clear error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (error) {
        console.warn('Redis disconnect error:', error);
      }
      this.connected = false;
    }
  }
}

// In-memory fallback cache (lightweight implementation)
class InMemoryCacheService implements CacheService {
  private cache = new Map<string, { value: any; expires: number }>();
  private readonly defaultTTL: number;

  constructor() {
    this.defaultTTL =
      parseInt(process.env.PRISMA_QUERY_CACHE_TTL || '60', 10) * 1000;
  }

  isConnected(): boolean {
    return true; // In-memory is always "connected"
  }

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const ttl = (ttlSeconds ?? this.defaultTTL / 1000) * 1000;
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });

    // Cleanup old entries if cache gets too large
    if (this.cache.size > 1000) {
      const now = Date.now();
      const toDelete: string[] = [];

      this.cache.forEach((entry, key) => {
        if (entry.expires < now) {
          toDelete.push(key);
        }
      });

      // If not enough expired, remove oldest 200
      if (toDelete.length < 200) {
        const entries = Array.from(this.cache.entries())
          .sort((a, b) => a[1].expires - b[1].expires)
          .slice(0, 200)
          .map(([key]) => key);
        toDelete.push(...entries);
      }

      toDelete.forEach((key) => this.cache.delete(key));
    }
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const toDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        toDelete.push(key);
      }
    });

    toDelete.forEach((key) => this.cache.delete(key));
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// Export singleton instance with automatic fallback
let cacheService: CacheService;

if (process.env.REDIS_URL && process.env.NODE_ENV !== 'test') {
  cacheService = new RedisCacheService();
} else {
  cacheService = new InMemoryCacheService();
}

export { cacheService };
export default cacheService;
