import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitService],
    }).compile();
    service = module.get<RateLimitService>(RateLimitService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
