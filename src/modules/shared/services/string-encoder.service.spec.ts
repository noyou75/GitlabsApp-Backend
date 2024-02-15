import { Test, TestingModule } from '@nestjs/testing';

import { StringEncoderService } from './string-encoder.service';

describe('StringEncoderService', () => {
  let service: StringEncoderService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StringEncoderService],
    }).compile();
    service = module.get<StringEncoderService>(StringEncoderService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('should encode data with default cost', async () => {
    const hash = await StringEncoderService.encode('P@ssw0rd');
    expect(hash).toBeDefined();
    expect(hash).toContain('$10$'); // Default cost of 10
    expect(hash).toHaveLength(60);
    expect(typeof hash).toBe('string');
  });
  it('should encode data with given cost', async () => {
    const hash = await StringEncoderService.encode('P@ssw0rd', 12);
    expect(hash).toBeDefined();
    expect(hash).toContain('$12$'); // Default cost of 10
    expect(hash).toHaveLength(60);
    expect(typeof hash).toBe('string');
  });
  it('should throw an error when cost is too low', async () => {
    expect.assertions(1);
    await expect(StringEncoderService.encode('P@ssw0rd', 3)).rejects.toBeInstanceOf(RangeError);
  });
  it('should throw an error when cost is too high', async () => {
    expect.assertions(1);
    await expect(StringEncoderService.encode('P@ssw0rd', 32)).rejects.toBeInstanceOf(RangeError);
  });
  it('should correctly compare two strings', async () => {
    expect.assertions(2);
    await expect(StringEncoderService.compare('P@ssw0rd', await StringEncoderService.encode('P@ssw0rd'))).resolves.toBe(true);
    await expect(StringEncoderService.compare('D1ffP@ssw0rd', await StringEncoderService.encode('P@ssw0rd'))).resolves.toBe(false);
  });
});
