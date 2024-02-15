import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientUser, SpecialistUser, StaffUser } from '../../entities/user.entity';
import { PatientUserService } from './patient/patient-user.service';
import { SpecialistUserService } from './specialist/specialist-user.service';
import { StaffUserService } from './staff/staff-user.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  const patientRepository = new Repository<PatientUser>();
  const specialistRepository = new Repository<SpecialistUser>();
  const staffRepository = new Repository<StaffUser>();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        PatientUserService,
        SpecialistUserService,
        StaffUserService,
        {
          provide: getRepositoryToken(PatientUser),
          useValue: patientRepository,
        },
        {
          provide: getRepositoryToken(SpecialistUser),
          useValue: specialistRepository,
        },
        {
          provide: getRepositoryToken(StaffUser),
          useValue: staffRepository,
        },
        {
          provide: CommandBus,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the proper repository', () => {
    expect(service.getRepository(PatientUser)).toBe(patientRepository);
    expect(service.getRepository(SpecialistUser)).toBe(specialistRepository);
    expect(service.getRepository(StaffUser)).toBe(staffRepository);
  });
});
