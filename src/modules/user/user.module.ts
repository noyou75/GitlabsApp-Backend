import { forwardRef, Module } from '@nestjs/common';
import { AppointmentModule } from '../appointment/appointment.module';
import { NotificationModule } from '../notification/notification.module';
import { LocaleModule } from '../locale/locale.module';
import { SharedModule } from '../shared/shared.module';
import { CreateUserCommand } from './create-user.command';
import { PatientUserModule } from './patient/patient-user.module';
import { SpecialistUserModule } from './specialist/specialist-user.module';
import { StaffUserModule } from './staff/staff-user.module';
import { UserService } from './user.service';
import { UserSubscriber } from './user.subscriber';

@Module({
  imports: [
    SharedModule,
    PatientUserModule,
    SpecialistUserModule,
    StaffUserModule,
    forwardRef(() => AppointmentModule),
    LocaleModule,
    forwardRef(() => NotificationModule),
  ],
  providers: [UserSubscriber, UserService, CreateUserCommand],
  exports: [UserService, PatientUserModule, SpecialistUserModule, StaffUserModule],
})
export class UserModule {}
