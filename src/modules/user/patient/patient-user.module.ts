import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientUser } from '../../../entities/user.entity';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { AppointmentModule } from '../../appointment/appointment.module';
import { AuthModule } from '../../auth/auth.module';
import { CreditModule } from '../../credit/credit.module';
import { EntityModule } from '../../entity/entity.module';
import { LocaleModule } from '../../locale/locale.module';
import { NotificationModule } from '../../notification/notification.module';
import { SharedModule } from '../../shared/shared.module';
import { PatientUserController } from './patient-user.controller';
import { PatientUserService } from './patient-user.service';
import { PatientUserVoter } from './patient-user-voter.service';
import { PatientUserSubscriber } from './patient-user.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([PatientUser]),
    SharedModule,
    EntityModule,

    // Use forwardRef to avoid circular dependencies
    forwardRef(() => NotificationModule),
    forwardRef(() => AppointmentModule),
    forwardRef(() => AuthModule),
    AnalyticsModule,
    LocaleModule,
    CreditModule,
  ],
  controllers: [PatientUserController],
  providers: [
    PatientUserService,
    PatientUserVoter,
    PatientUserSubscriber
  ],
  exports: [PatientUserService],
})
export class PatientUserModule {}
