import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisConfig } from '../enums/config.enum';

import { ConfigService } from './config.service';

@Injectable()
export class RedisService implements OnApplicationShutdown {
  protected client: Redis.Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis(configService.get(RedisConfig.URL));
  }

  onApplicationShutdown() {
    return this.disconnect();
  }

  getClient(): Redis.Redis {
    return this.client;
  }

  async isConnected(): Promise<boolean> {
    return (await this.client.ping()) === 'PONG';
  }

  async disconnect() {
    return await this.client.quit();
  }
}
