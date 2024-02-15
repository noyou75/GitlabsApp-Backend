import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';

describe('ConfigService', () => {
  let service: ConfigService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: new ConfigService(new LoggerService()),
        },
      ],
    }).compile();
    service = module.get<ConfigService>(ConfigService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
