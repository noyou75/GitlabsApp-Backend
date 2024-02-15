import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffUser } from '../../../entities/user.entity';
import { StaffUserService } from './staff-user.service';

describe('StaffUserService', () => {
  let service: StaffUserService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffUserService,
        {
          provide: getRepositoryToken(StaffUser),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<StaffUserService>(StaffUserService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
