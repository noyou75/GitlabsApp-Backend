import { Test, TestingModule } from '@nestjs/testing';

import { ConfigService } from './config.service';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: new ConfigService(new LoggerService()),
        },
      ],
    }).compile();
    service = module.get<LoggerService>(LoggerService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
