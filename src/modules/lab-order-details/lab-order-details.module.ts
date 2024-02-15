import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabOrderDetailsEntity } from '../../entities/lab-order-details.entity';
import { LabOrderDetailsService } from './lab-order-details.service';

@Module({
  imports: [TypeOrmModule.forFeature([LabOrderDetailsEntity])],
  providers: [LabOrderDetailsService],
  exports: [LabOrderDetailsService],
})
export class LabOrderDetailsModule {}
