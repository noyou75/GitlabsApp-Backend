import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RateLimitInterceptor } from './rate-limit.interceptor';
import { RateLimitService } from './rate-limit.service';

export const RATE_LIMIT_METADATA = 'rate-limit';

@Module({
  providers: [
    RateLimitService,
    {
      // Register global interceptor here for dependency injection
      provide: APP_INTERCEPTOR,
      useFactory: async (service: RateLimitService) => {
        return new RateLimitInterceptor(service, {
          // Rate limit each ip + request method + endpoint to 100 requests per 5 mins
          interval: 300,
          limit: 100,
          key: req => ['request', req.ip, req.method, req.route.path].filter(Boolean).join(':'),
        });
      },
      inject: [RateLimitService],
    },
  ],
  exports: [RateLimitService],
})
export class RateLimitModule {}
