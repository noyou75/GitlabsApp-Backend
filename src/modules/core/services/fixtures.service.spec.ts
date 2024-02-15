import { Test, TestingModule } from '@nestjs/testing';
import { FixturesService } from './fixtures.service';
import { getConnectionToken } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

jest.mock('typeorm');

describe('FixturesService', () => {
  let service: FixturesService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixturesService,
        // {
        //   provide: getConnectionToken(),
        //   useClass: Connection,
        // },
      ],
    }).compile();
    service = module.get<FixturesService>(FixturesService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
