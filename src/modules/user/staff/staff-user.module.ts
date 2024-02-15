import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { SharedModule } from '../../shared/shared.module';
import { StaffUserController } from './staff-user.controller';
import { StaffUser } from '../../../entities/user.entity';
import { StaffUserService } from './staff-user.service';
import { StaffUserVoter } from './staff-user.voter';
import { MarketModule } from '../../market/market.module';

@Module({
  imports: [TypeOrmModule.forFeature([StaffUser]), SharedModule, AnalyticsModule, MarketModule],
  controllers: [StaffUserController],
  providers: [StaffUserService, StaffUserVoter],
  exports: [StaffUserService],
})
export class StaffUserModule {}
