import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../../entities/file.entity';

import { FileService } from './file.service';

describe('FileService', () => {
  let service: FileService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: getRepositoryToken(FileEntity),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<FileService>(FileService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
