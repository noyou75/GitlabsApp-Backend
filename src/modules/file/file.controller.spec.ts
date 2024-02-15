import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../../entities/file.entity';
import { FileController } from './file.controller';
import { FileService } from './file.service';

describe('File Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        FileService,
        {
          provide: getRepositoryToken(FileEntity),
          useClass: Repository,
        },
      ],
    }).compile();
  });
  it('should be defined', () => {
    const controller: FileController = module.get<FileController>(FileController);
    expect(controller).toBeDefined();
  });
});
