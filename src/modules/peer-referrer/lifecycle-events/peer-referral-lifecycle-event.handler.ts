import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AwardTriggersEnum } from '../../../common/enums/award-triggers.enum';
import { PeerReferralData, ReferralEmbed, ReferrerType } from '../../../entities/embed/referral.embed';
import { PeerReferralEntity, PeerReferralStatus } from '../../../entities/peer-referral.entity';
import { PatientUser } from '../../../entities/user.entity';
import { EntityLifecycleEvent, EntityLifecycleEventHandler, EntityLifecycleEventTypes } from '../../entity/services/entity-subscriber.service';
import { LoggerService } from '../../core/services/logger.service';
import { PatientUserService } from '../../user/patient/patient-user.service';
import { AwardCampaignService } from '../../awards/services/award-campaign.service';

@Injectable()
@EntityLifecycleEvent(PatientUser, EntityLifecycleEventTypes.Created, {
  executeOn: 'after',
})
export class PeerReferralLifecycleEventHandler implements EntityLifecycleEventHandler<PatientUser> {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly awardCampaign: AwardCampaignService,
    private readonly patientUserService: PatientUserService,
  ) {

  }

  async handle(event: EntityLifecycleEventTypes, entityDetails: { newEntity: PatientUser, entityManager: EntityManager }) {
    /* If the new patient user has a referral that indicates a peer referral, we will need to create a PeerReferral object
     * for this particular user. */
    const partnerReferral = entityDetails.newEntity?.partnerReferral?.find(
      ref => ref.referralMethod === ReferrerType.Peer
    ) as ReferralEmbed<PeerReferralData>;

    if (!partnerReferral) {
      return;
    }

    const [ referrer, campaigns ] = await Promise.all([
      /* Determine who the referrer is based on the embedded link. */
      this.patientUserService.find(opts => opts.where = {
        referralCode: partnerReferral.data.referralLink,
      }),

      /* Determine what the current campaigns NewPatientReferral campaigns are. */
      this.awardCampaign.find(opts => opts.where = {
        trigger: AwardTriggersEnum.AppointmentCompletion,
        isActive: true,
      })
    ]);

    /* If no referrer can be resolved, log an exception, but do not prevent the entity from completing its operation. */
    if (!referrer || !referrer.data.length) {
      this.loggerService.error(`Cannot create PeerReferral object for new user - no referrer can be resolved from the `)
    }

    /* If no campaign is active, log an error, but do not prevent the entity from completing its operation. */
    if (!campaigns || !campaigns.data || !campaigns.data.length) {
      this.loggerService.error(`Cannot create PeerReferral object for new user - no NewPatientReferral campaigns ` +
        `are presently active.`);

      return;
    }

    /* Create the peer referrer object */
    await entityDetails.entityManager.save(Object.assign(new PeerReferralEntity(), {
      awardCampaign: campaigns.data.find(campaign => campaign.isDefault) || campaigns.data[0],
      referrer: referrer.data[0],
      status: PeerReferralStatus.Pending,
      referree: entityDetails.newEntity,
    }));
  }
}
