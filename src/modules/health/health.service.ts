import { Injectable } from '@nestjs/common';
import { DiskHealthIndicator, TerminusEndpoint, TerminusModuleOptions, TerminusOptionsFactory } from '@nestjs/terminus';

@Injectable()
export class HealthService implements TerminusOptionsFactory {
  constructor(private readonly disk: DiskHealthIndicator) {}

  public createTerminusOptions(): Promise<TerminusModuleOptions> | TerminusModuleOptions {
    const endpoint: TerminusEndpoint = {
      url: '/',
      healthIndicators: [async () => this.disk.checkStorage('disk', { thresholdPercent: 0.95, path: '/' })],
    };

    return {
      endpoints: [endpoint],
    };
  }
}
