import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RedisHealthIndicator } from './health-indicators/redis.health';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  providers: [RedisHealthIndicator],
  controllers: [HealthController],
  exports: [],
})
export class HealthModule {}
