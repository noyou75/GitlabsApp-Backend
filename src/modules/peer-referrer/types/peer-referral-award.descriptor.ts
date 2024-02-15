import { Type } from '@nestjs/common';
import { AwardCampaignEntity } from '../../../entities/award-campaign.entity';
import { PeerReferralEntity } from '../../../entities/peer-referral.entity';
import { ActorAwardDescriptor, AwardFulfillmentData } from '../../awards/services/award-descriptor.service';
import { INotification } from '../../notification/notification';

export interface PeerReferralAwardFulfillmentData extends AwardFulfillmentData {
  notification: Type<INotification>,
}

export class PeerReferralAwardDescriptor implements ActorAwardDescriptor {
  constructor(
    public readonly peerReferral: PeerReferralEntity,
    private readonly fulfillmentData?: PeerReferralAwardFulfillmentData,
  ) { }

  getActor() {
    return this.peerReferral.referree;
  }

  getCampaign(): AwardCampaignEntity {
    return this.peerReferral.awardCampaign;
  }

  getFulfillmentData(): PeerReferralAwardFulfillmentData {
    return this.fulfillmentData;
  }
}
