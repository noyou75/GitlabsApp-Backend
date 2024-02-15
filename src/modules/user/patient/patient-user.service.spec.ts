import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientUser } from '../../../entities/user.entity';
import { PatientUserService } from './patient-user.service';

describe('PatientUserService', () => {
  let service: PatientUserService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientUserService,
        {
          provide: getRepositoryToken(PatientUser),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<PatientUserService>(PatientUserService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
