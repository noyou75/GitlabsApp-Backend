import { Test, TestingModule } from '@nestjs/testing';
import { Timezone, TimezoneService } from './timezone.service';
import { isArray, every } from 'lodash';

describe('TimezoneService', () => {
  let service: TimezoneService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimezoneService],
    }).compile();
    service = module.get<TimezoneService>(TimezoneService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should return a list of timezone ID strings', () => {
    const ids = service.ids();
    expect(isArray(ids)).toBe(true);
    expect(every(ids, String)).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
  });
  it('should return true if the given timezone exists', () => {
    expect(service.has('America/Los_Angeles')).toBe(true);
  });
  it('should return false if the given timezone does not exists', () => {
    expect(service.has('Invalid/Timezone')).toBe(false);
  });
  it('should return the timezone if it exists', () => {
    const tz = service.get('America/Los_Angeles');
    expect(tz).toBeInstanceOf(Timezone);
    expect(tz.id).toBe('America/Los_Angeles');
    expect(tz.name).toBe('Pacific Daylight Time');
    expect(tz.text).toBe('(UTC-07:00) Pacific Time (US & Canada)');
    expect(tz.abbr).toBe('PDT');
    expect(tz.offset).toBe(-7);
  });
  it('should return undefined if the given timezone does not exists', () => {
    expect(service.get('Invalid/Timezone')).toBe(undefined);
  });
});
