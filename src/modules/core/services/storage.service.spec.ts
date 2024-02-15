import { Storage, File } from '@google-cloud/storage';
import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from './logger.service';
import { StorageService } from './storage.service';

jest.mock('@google-cloud/storage');
jest.mock('./logger.service');

describe('StorageService', () => {
  let service: StorageService;
  let client: Storage;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService, LoggerService],
    }).compile();
    service = module.get<StorageService>(StorageService);
    client = service.getClient();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should return the storage client', () => {
    expect(service.getClient()).toBeInstanceOf(Storage);
  });
});
