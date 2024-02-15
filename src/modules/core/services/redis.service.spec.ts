import { Test, TestingModule } from '@nestjs/testing';
import * as Redis from 'ioredis';

import { ConfigService } from './config.service';
import { RedisService } from './redis.service';

jest.mock('./config.service');

describe('RedisService', () => {
  let service: RedisService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, RedisService],
    }).compile();
    service = module.get<RedisService>(RedisService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should return the redis client', () => {
    expect(service.getClient()).toBeInstanceOf(Redis);
  });
  it('should disconnected the client', () => {
    const disconnect = jest.spyOn(service, 'disconnect').mockReturnValue(Promise.resolve('OK'));
    service.disconnect();
    expect(disconnect).toHaveBeenCalled();
  });
});
