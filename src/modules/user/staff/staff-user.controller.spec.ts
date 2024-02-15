import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffUser } from '../../../entities/user.entity';
import { StaffUserController } from './staff-user.controller';
import { StaffUserService } from './staff-user.service';

describe('StaffUser Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [StaffUserController],
      providers: [
        StaffUserService,
        {
          provide: getRepositoryToken(StaffUser),
          useClass: Repository,
        },
      ],
    }).compile();
  });
  it('should be defined', () => {
    const controller: StaffUserController = module.get<StaffUserController>(StaffUserController);
    expect(controller).toBeDefined();
  });
});
