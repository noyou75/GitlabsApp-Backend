import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpecialistUser } from '../../../entities/user.entity';
import { SpecialistUserService } from './specialist-user.service';

describe('SpecialistUserService', () => {
  let service: SpecialistUserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<SpecialistUserService>(SpecialistUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
