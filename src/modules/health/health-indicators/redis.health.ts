import { Injectable, Scope } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult, TimeoutError } from '@nestjs/terminus';
import { checkPackages, promiseTimeout, TimeoutError as PromiseTimeoutError } from '@nestjs/terminus/dist/utils';
import { RedisService } from '../../core/services/redis.service';

export interface RedisPingCheckSettings {
  /**
   * The amount of time the check should require in ms
   */
  timeout?: number;
}

@Injectable({ scope: Scope.TRANSIENT })
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
    this.checkDependantPackages();
  }

  async pingCheck(key: string, options: RedisPingCheckSettings = {}): Promise<HealthIndicatorResult> {
    let isHealthy = false;

    this.checkDependantPackages();

    const timeout = options.timeout || 1000;

    try {
      await this.pingRedis(timeout);
      isHealthy = true;
    } catch (err) {
      if (err instanceof PromiseTimeoutError) {
        throw new TimeoutError(
          timeout,
          this.getStatus(key, isHealthy, {
            message: `timeout of ${timeout}ms exceeded`,
          }),
        );
      }
    }

    if (isHealthy) {
      return this.getStatus(key, isHealthy);
    } else {
      throw new HealthCheckError(`${key} is not available`, this.getStatus(key, isHealthy));
    }
  }

  private checkDependantPackages() {
    checkPackages(['ioredis'], this.constructor.name);
  }

  private async pingRedis(timeout: number) {
    return await promiseTimeout(timeout, this.redis.isConnected());
  }
}
