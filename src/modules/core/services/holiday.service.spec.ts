import { Test, TestingModule } from '@nestjs/testing';
import { HolidayService } from './holiday.service';

describe('HolidayService', () => {
  let service: HolidayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HolidayService],
    }).compile();

    service = module.get<HolidayService>(HolidayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
