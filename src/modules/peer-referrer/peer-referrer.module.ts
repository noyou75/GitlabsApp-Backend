import { Module } from '@nestjs/common';
import { AwardsModule } from '../awards/awards.module';
import { NotificationModule } from '../notification/notification.module';
import { PatientCreditModule } from '../patient-credit/patient-credit.module';
import { PatientUserModule } from '../user/patient/patient-user.module';
import { ReferrerCreditAwardProcessor } from './award-processors/referrer-credit-award.processor';
import { PeerReferralActiveCondition } from './conditions/peer-referral-active.condition';
import { PeerReferralLifecycleEventHandler } from './lifecycle-events/peer-referral-lifecycle-event.handler';
import { PeerReferralService } from './services/peer-referral.service';

@Module({
  imports: [
    AwardsModule,
    PatientUserModule,
    PatientCreditModule,
    NotificationModule,
  ],

  providers: [
    PeerReferralService,
    PeerReferralLifecycleEventHandler,
    ReferrerCreditAwardProcessor,
    PeerReferralActiveCondition,
  ],

  exports: [
    PeerReferralService,
  ]
})
export class PeerReferrerModule {

}
