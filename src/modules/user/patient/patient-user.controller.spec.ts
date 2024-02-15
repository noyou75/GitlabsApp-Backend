import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientUser } from '../../../entities/user.entity';
import { PatientUserController } from './patient-user.controller';
import { PatientUserService } from './patient-user.service';

describe('PatientUser Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [PatientUserController],
      providers: [
        PatientUserService,
        {
          provide: getRepositoryToken(PatientUser),
          useClass: Repository,
        },
      ],
    }).compile();
  });
  it('should be defined', () => {
    const controller: PatientUserController = module.get<PatientUserController>(PatientUserController);
    expect(controller).toBeDefined();
  });
});
