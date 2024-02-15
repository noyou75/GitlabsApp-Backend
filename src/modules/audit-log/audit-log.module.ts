import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from '../../entities/audit-log.entity';
import { SharedModule } from '../shared/shared.module';
import { AuditLogSubscriber } from './audit-log.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity]), SharedModule],
  providers: [AuditLogSubscriber],
})
export class AuditLogModule {}
