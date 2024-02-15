import { Test, TestingModule } from '@nestjs/testing';
import { CommandService } from './command.service';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';

describe('CommandService', () => {
  let service: CommandService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommandService, MetadataScanner],
    }).compile();
    service = module.get<CommandService>(CommandService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
