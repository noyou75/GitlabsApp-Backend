import { Injectable } from '@nestjs/common';
import { AwardType } from '../../../common/enums/award-type.enum';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { AwardDescriptorResolver, IAwardDescriptorResolver } from '../../awards/services/award-descriptor.service';
import { PeerReferralService } from '../../peer-referrer/services/peer-referral.service';
import { PeerReferralAwardDescriptor } from '../../peer-referrer/types/peer-referral-award.descriptor';
import { ReferredAppointmentAwardNotification } from '../notifications/referred-appointment-award.notification';

@Injectable()
@AwardDescriptorResolver({
  awardType: AwardType.OneTimeReferrerCreditAward,
  entity: AppointmentEntity,
})
export class AppointmentAwardDescriptorResolver implements IAwardDescriptorResolver<AppointmentEntity> {
  constructor (private readonly peerReferralService: PeerReferralService) { }

  async resolve(entity: AppointmentEntity) {
    const peerReferral = await this.peerReferralService.getPeerReferral(entity.patient);

    return peerReferral && new PeerReferralAwardDescriptor(
      peerReferral,
      {
        notification: ReferredAppointmentAwardNotification,
      });
  }
}
