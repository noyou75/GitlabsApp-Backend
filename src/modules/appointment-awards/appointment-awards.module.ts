import { Module } from '@nestjs/common';
import { AppointmentModule } from '../appointment/appointment.module';
import { AwardsModule } from '../awards/awards.module';
import { PeerReferrerModule } from '../peer-referrer/peer-referrer.module';
import { FirstTimeBookingCondition } from './conditions/first-time-booking.condition';
import { AppointmentAwardDescriptorResolver } from './resolver/appointment-award-descriptor.resolver';
import { NewPatientReferralTrigger } from './triggers/new-patient-referral.trigger';

@Module({
  imports: [
    AppointmentModule,
    AwardsModule,
    PeerReferrerModule,
  ],

  providers: [
    AppointmentAwardDescriptorResolver,
    FirstTimeBookingCondition,
    NewPatientReferralTrigger,
  ],
})
export class AppointmentAwardsModule {

}
