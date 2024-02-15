import { Injectable } from '@nestjs/common';
import { secureid } from '../../common/string.utils';
import { microtime } from '../../common/time.utils';
import { RedisService } from '../core/services/redis.service';
import { RateLimitOptions } from './rate-limit.decorator';

export interface RateLimitResults {
  remaining: number;
  resetInMs: number;
}

@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisService) {}

  async isRateLimited(id: string, options: RateLimitOptions): Promise<boolean> {
    const result = await this.limit(id, options);
    return !result.remaining && result.resetInMs > 0;
  }

  /**
   * Sliding window rate limit algorithm with atomic redis transactions to be multi-node async safe
   */
  async limit(id: string, options: RateLimitOptions): Promise<RateLimitResults> {
    const client = this.redis.getClient();

    const interval = options.interval * 1000 * 1000; // microseconds

    const now = microtime();
    const key = `rate-limit:${id}`;

    return new Promise((resolve, reject) => {
      const batch = client.multi();
      batch.zremrangebyscore(key, 0, now - interval);
      batch.zrange(key, 0, -1, 'WITHSCORES');
      batch.zadd(key, now.toString(), secureid());
      batch.expire(key, Math.ceil(interval / 1000000));
      batch.exec((err, resultArr) => {
        if (err) {
          reject(err);
        }

        // Access the results of the 2nd element of the ZRANGE command
        // IORedis formats the result as [err, [<requests>]]
        const zrange = resultArr[1][1] as string[];

        const set = zrange.filter((e, i) => i % 2 !== 0).map(Number);

        const remaining = Math.max(0, options.limit - set.length - 1);

        const timeUntilNext = set.length >= options.limit ? set[set.length - options.limit] - now + interval : 0;

        resolve({
          remaining,
          resetInMs: Math.floor(timeUntilNext / 1000),
        });
      });
    });
  }
}
