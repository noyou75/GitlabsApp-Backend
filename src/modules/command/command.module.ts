import { Module } from '@nestjs/common';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { CommandService } from './command.service';
import { OrmGenerateFakeDataCommand } from './orm-generate-fake-data.command';
import { OrmLoadFixturesCommand } from './orm-load-fixtures.command';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [MetadataScanner, CommandService, OrmLoadFixturesCommand, OrmGenerateFakeDataCommand],
})
export class CommandModule {}
