import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LocaleModule } from '../locale/locale.module';
import { SharedModule } from '../shared/shared.module';
import { PatientUserModule } from '../user/patient/patient-user.module';
import { AvailabilityV2Service } from './availability-v2.service';
import { AvailabilityController } from './availability.controller';

@Module({
  imports: [PatientUserModule, LocaleModule, SharedModule, AnalyticsModule],
  providers: [AvailabilityV2Service],
  exports: [],
  controllers: [AvailabilityController],
})
export class AvailabilityModule {}
