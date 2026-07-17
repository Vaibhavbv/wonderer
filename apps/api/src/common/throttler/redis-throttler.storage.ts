import { Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

/**
 * Redis-backed throttler storage so rate limits hold across instances — the
 * default in-memory store is per-process and defeated by horizontal scaling.
 *
 * Fails OPEN: if Redis is unreachable the request is allowed (with a warning)
 * rather than 500ing the whole API. Rate limiting is a shield, not a
 * correctness dependency.
 */
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly redis: Redis;

  constructor(host: string, port: number, password?: string) {
    this.redis = new Redis({
      host,
      port,
      password,
      // Fail fast when Redis is down instead of queueing commands forever.
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.redis.on('error', (err) => this.logger.warn(`Redis throttler connection: ${err.message}`));
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `throttler:${throttlerName}:${key}:hits`;
    const blockKey = `throttler:${throttlerName}:${key}:block`;

    try {
      const blockTtlMs = await this.redis.pttl(blockKey);
      if (blockTtlMs > 0) {
        return {
          totalHits: limit + 1,
          timeToExpire: 0,
          isBlocked: true,
          timeToBlockExpire: Math.ceil(blockTtlMs / 1000),
        };
      }

      const totalHits = await this.redis.incr(hitKey);
      if (totalHits === 1) {
        await this.redis.pexpire(hitKey, ttl);
      }
      const remainingMs = await this.redis.pttl(hitKey);
      const timeToExpire = Math.max(0, Math.ceil(remainingMs / 1000));

      if (totalHits > limit) {
        const blockMs = blockDuration > 0 ? blockDuration : Math.max(remainingMs, 1000);
        await this.redis.set(blockKey, '1', 'PX', blockMs);
        return {
          totalHits,
          timeToExpire,
          isBlocked: true,
          timeToBlockExpire: Math.ceil(blockMs / 1000),
        };
      }

      return { totalHits, timeToExpire, isBlocked: false, timeToBlockExpire: 0 };
    } catch (err) {
      this.logger.warn(`Throttler storage unavailable, allowing request: ${err.message}`);
      return { totalHits: 1, timeToExpire: Math.ceil(ttl / 1000), isBlocked: false, timeToBlockExpire: 0 };
    }
  }
}
