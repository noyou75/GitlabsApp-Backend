import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TextMessagingService } from '../notification/services/text-messaging.service';

import { LoggerService } from '../core/services/logger.service';
import { RedisService } from '../core/services/redis.service';
import { StringEncoderService } from '../shared/services/string-encoder.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

jest.mock('../user/user.service');
jest.mock('../shared/services/code-generator.service');
jest.mock('../shared/services/string-encoder.service');
jest.mock('../core/services/logger.service');
jest.mock('../core/services/redis.service');
jest.mock('@nestjs/jwt');

describe('AuthService', () => {
  let service: AuthService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule],
      providers: [
        AuthService,
        UserService,
        StringEncoderService,
        JwtService,
        RedisService,
        { provide: TextMessagingService, useValue: {} },
        LoggerService,
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
