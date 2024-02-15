import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';

describe('StripeService', () => {
  let service: StripeService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeService],
    }).compile();
    service = module.get<StripeService>(StripeService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
