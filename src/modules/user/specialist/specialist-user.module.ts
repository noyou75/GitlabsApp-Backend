import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecialistUser } from '../../../entities/user.entity';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { AppointmentModule } from '../../appointment/appointment.module';
import { SharedModule } from '../../shared/shared.module';
import { SpecialistUserController } from './specialist-user.controller';
import { SpecialistUserService } from './specialist-user.service';
import { SpecialistUserVoter } from './specialist-user.voter';
import { MarketModule } from '../../market/market.module';

@Module({
  imports: [TypeOrmModule.forFeature([SpecialistUser]), SharedModule, forwardRef(() => AppointmentModule), AnalyticsModule, MarketModule],
  controllers: [SpecialistUserController],
  providers: [SpecialistUserService, SpecialistUserVoter],
  exports: [SpecialistUserService],
})
export class SpecialistUserModule {}
