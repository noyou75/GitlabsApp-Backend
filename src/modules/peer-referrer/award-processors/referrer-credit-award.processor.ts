import { Injectable, Type } from '@nestjs/common';
import { AwardType } from '../../../common/enums/award-type.enum';
import { CreditSourceEnum } from '../../../common/enums/credit-source.enum';
import { PeerReferralStatus } from '../../../entities/peer-referral.entity';
import { NotificationService } from '../../notification/services/notification.service';
import { PatientCreditService } from '../../patient-credit/patient-credit.service';
import { Award, AwardProcessor } from '../../awards/services/award-type.service';
import { PeerReferralService } from '../services/peer-referral.service';
import { PeerReferralAwardDescriptor } from '../types/peer-referral-award.descriptor';

@Award(AwardType.OneTimeReferrerCreditAward)
@Injectable()
export class ReferrerCreditAwardProcessor implements AwardProcessor<any, PeerReferralAwardDescriptor> {
  constructor(
    private readonly patientCreditService: PatientCreditService,
    private readonly peerReferralService: PeerReferralService,
    private readonly notificationService: NotificationService,
  ) { }

  async process(target: any, awardDesc: PeerReferralAwardDescriptor) {
    /* The referrer credit award implementation is quite simple - we simply issue the supplied number of credits
     * to the indicated recipient. */
    await this.patientCreditService.issueCredit(awardDesc.peerReferral.referrer, awardDesc.getCampaign().award,
      CreditSourceEnum.Referral);

    /* Issue notification here */
    awardDesc.getFulfillmentData()?.notification &&
      await this.notificationService.send(awardDesc.getFulfillmentData()?.notification, awardDesc.peerReferral.referrer, {
        peerReferral: awardDesc.peerReferral
      });

    /* Set the award as fulfilled, as this award may only be fulfilled a single time... */
    await this.peerReferralService.update(awardDesc.peerReferral, {
      status: PeerReferralStatus.Fulfilled,
    });
  }
}
