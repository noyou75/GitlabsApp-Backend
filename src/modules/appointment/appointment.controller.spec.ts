import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentEntity } from '../../entities/appointment.entity';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

describe('AppointmentController', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [
        AppointmentService,
        {
          provide: getRepositoryToken(AppointmentEntity),
          useClass: Repository,
        },
      ],
    }).compile();
  });

  it('should be defined', () => {
    const controller: AppointmentController = module.get<AppointmentController>(AppointmentController);
    expect(controller).toBeDefined();
  });
});
