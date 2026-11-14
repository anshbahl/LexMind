import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

class CacheService {
  private client: Redis | null = null;
  private inMemoryFallback: Map<string, { value: string; expiry: number }> = new Map();
  private isConnected = false;

  constructor() {
    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => {
          if (times > 3) return null;
          return Math.min(times * 100, 1000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Connected to Redis cache service');
      });

      this.client.on('error', (_err: any) => {
        // Fall back gracefully to in-memory cache without crashing
        this.isConnected = false;
      });
    } catch {
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        // Fallback
      }
    }
    const item = this.inMemoryFallback.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.inMemoryFallback.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, value, 'EX', ttlSeconds);
        return;
      } catch {
        // Fallback
      }
    }
    this.inMemoryFallback.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {
        // Fallback
      }
    }
    this.inMemoryFallback.delete(key);
  }

  async flushPattern(patternPrefix: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys(`${patternPrefix}*`);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } catch {
        // Fallback
      }
    }
    for (const key of this.inMemoryFallback.keys()) {
      if (key.startsWith(patternPrefix)) {
        this.inMemoryFallback.delete(key);
      }
    }
  }
}

export const cache = new CacheService();
