import { Test, TestingModule } from '@nestjs/testing';
import { HelloSignService } from './hello-sign.service';

describe('HelloSignService', () => {
  let service: HelloSignService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelloSignService],
    }).compile();

    service = module.get<HelloSignService>(HelloSignService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
