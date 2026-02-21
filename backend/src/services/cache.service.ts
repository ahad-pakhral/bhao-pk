// Redis cache wrapper with TTL support
// Product data lives ONLY here — never persisted to PostgreSQL

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null; // Stop retrying
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});

let connected = false;

redis.on('connect', () => {
  connected = true;
  console.log('Redis connected');
});

redis.on('error', (err) => {
  if (connected) {
    console.error('Redis error:', err.message);
  }
  connected = false;
});

// Attempt connection (non-blocking — app works without Redis)
redis.connect().catch(() => {
  console.warn('Redis not available — cache disabled, all searches will be live');
});

/**
 * Get cached value. Returns null on cache miss or Redis unavailable.
 */
export async function cacheGet(key: string): Promise<any | null> {
  if (!connected) return null;
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

/**
 * Set cached value with TTL in seconds.
 */
export async function cacheSet(key: string, value: any, ttlSeconds: number): Promise<void> {
  if (!connected) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Non-critical — skip caching
  }
}

/**
 * Delete a cache key.
 */
export async function cacheDel(key: string): Promise<void> {
  if (!connected) return;
  try {
    await redis.del(key);
  } catch {
    // Non-critical
  }
}
