import { Test, TestingModule } from '@nestjs/testing';
import { Twilio } from 'twilio';
import { TextMessagingService } from './text-messaging.service';

jest.mock('twilio');

describe('TextMessagingService', () => {
  let service: TextMessagingService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TextMessagingService,
          useValue: new TextMessagingService(new Twilio('username', 'password'), 'mssid', null, null, null),
        },
      ],
    }).compile();
    service = module.get<TextMessagingService>(TextMessagingService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
