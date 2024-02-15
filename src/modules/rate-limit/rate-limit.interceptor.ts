import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { RateLimitOptions } from './rate-limit.decorator';
import { RATE_LIMIT_METADATA } from './rate-limit.module';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private readonly service: RateLimitService, private readonly defaults: RateLimitOptions) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const meta: RateLimitOptions = Reflect.getMetadata(RATE_LIMIT_METADATA, context.getHandler()) || {};

    const options = { ...this.defaults, ...meta };

    const httpContext = context.switchToHttp();

    const key = typeof options.key === 'function' ? options.key.call(null, httpContext.getRequest()) : options.key;

    const result = await this.service.limit(key, options);

    const res: Response = httpContext.getResponse();

    res.setHeader('X-RateLimit-Period', options.interval);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Next', result.resetInMs);

    if (!result.remaining && result.resetInMs > 0) {
      throw new HttpException(`Try again in ${result.resetInMs}ms!`, HttpStatus.TOO_MANY_REQUESTS);
    }

    return next.handle();
  }
}
