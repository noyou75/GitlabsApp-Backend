import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('healthz')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
  ) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    // No specific health checks need to be performed here, just respond with an HTTP 200
    return this.health.check([]);
  }
}
