import { Injectable } from '@nestjs/common';
import { AwardConditionsEnum } from '../../../common/enums/award-conditions.enum';
import { AwardCampaignEntity } from '../../../entities/award-campaign.entity';
import { PeerReferralStatus } from '../../../entities/peer-referral.entity';
import { AwardConditions, AwardConditionsHandler } from '../../awards/services/award-conditions.service';
import { PeerReferralAwardDescriptor } from '../types/peer-referral-award.descriptor';

@Injectable()
@AwardConditions(AwardConditionsEnum.PeerReferralActive)
export class PeerReferralActiveCondition implements AwardConditionsHandler<any, PeerReferralAwardDescriptor> {
  async isEligible(awardCampaign: AwardCampaignEntity, target: any, awardDescriptor: PeerReferralAwardDescriptor) {
    /* Assess that the inbound peerReferralEntity is current */
    return awardDescriptor.peerReferral.status === PeerReferralStatus.Pending;
  }
}
