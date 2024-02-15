import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';

import { IsUniqueConstraint } from './is-unique.constraint';

describe('IsUniqueConstraint', () => {
  let service: IsUniqueConstraint;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IsUniqueConstraint,
        {
          provide: EntityManager,
          useValue: {}, // TODO: Add proper mock and tests
        },
      ],
    }).compile();
    service = module.get<IsUniqueConstraint>(IsUniqueConstraint);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
