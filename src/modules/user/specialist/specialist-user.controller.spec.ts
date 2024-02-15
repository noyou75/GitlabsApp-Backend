import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpecialistUser } from '../../../entities/user.entity';
import { SpecialistUserController } from './specialist-user.controller';
import { SpecialistUserService } from './specialist-user.service';

describe('SpecialistUser Controller', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [SpecialistUserController],
      providers: [
        SpecialistUserService,
        {
          provide: getRepositoryToken(SpecialistUser),
          useClass: Repository,
        },
        {
          provide: CommandBus,
          useValue: {},
        },
      ],
    }).compile();
  });

  it('should be defined', () => {
    const controller: SpecialistUserController = module.get<SpecialistUserController>(SpecialistUserController);
    expect(controller).toBeDefined();
  });
});
