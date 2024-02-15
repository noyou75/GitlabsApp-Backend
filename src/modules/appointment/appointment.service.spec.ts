import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentEntity } from '../../entities/appointment.entity';
import { AppointmentService } from './appointment.service';

describe('AppointmentService', () => {
  let service: AppointmentService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: getRepositoryToken(AppointmentEntity),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<AppointmentService>(AppointmentService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
