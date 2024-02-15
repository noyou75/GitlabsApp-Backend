import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../../entities/file.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FileSubscriber } from './file.subscriber';
import { FileVoter } from './file.voter';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), SharedModule, AnalyticsModule],
  providers: [FileService, FileSubscriber, FileVoter],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
