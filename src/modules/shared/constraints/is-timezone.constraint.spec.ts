import { Test, TestingModule } from '@nestjs/testing';

import { IsTimezoneConstraint } from './is-timezone.constraint';
import { TimezoneService } from '../../core/services/timezone.service';

jest.mock('~app/modules/core/services/timezone.service');

describe('IsTimezone', () => {
  let constraint: IsTimezoneConstraint;
  let service: TimezoneService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IsTimezoneConstraint, TimezoneService],
    }).compile();
    constraint = module.get(IsTimezoneConstraint);
    service = module.get(TimezoneService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(constraint).toBeDefined();
  });
  it('should return true if a valid timezone string is given', () => {
    const has = jest.spyOn(service, 'has').mockImplementation(() => true);
    expect(constraint.validate('America/Toronto')).toBe(true);
    expect(has).toBeCalledWith('America/Toronto');
  });
  it('should return false if an invalid timezone string is given', () => {
    const has = jest.spyOn(service, 'has').mockImplementation(() => false);
    expect(constraint.validate('Invalid/Timezone')).toBe(false);
    expect(has).toBeCalledWith('Invalid/Timezone');
  });
  it('should return false if non string is given', () => {
    const has = jest.spyOn(service, 'has').mockImplementation(() => false);
    expect(constraint.validate(12345)).toBe(false);
    expect(has).toBeCalledTimes(0);
  });
});
