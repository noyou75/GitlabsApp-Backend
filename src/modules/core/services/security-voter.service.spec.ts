import { Test, TestingModule } from '@nestjs/testing';
import { SecurityVoterService } from './security-voter.service';

describe('SecurityVoterService', () => {
  let service: SecurityVoterService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityVoterService],
    }).compile();
    service = module.get<SecurityVoterService>(SecurityVoterService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
