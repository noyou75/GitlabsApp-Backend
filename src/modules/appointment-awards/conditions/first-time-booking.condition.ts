import { Injectable } from '@nestjs/common';
import {getRepository, Not} from 'typeorm';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { AwardConditionsEnum } from '../../../common/enums/award-conditions.enum';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { AwardCampaignEntity } from '../../../entities/award-campaign.entity';
import { ActorAwardDescriptor } from '../../awards/services/award-descriptor.service';
import { AwardConditions, AwardConditionsHandler } from '../../awards/services/award-conditions.service';

@Injectable()
@AwardConditions(AwardConditionsEnum.FirstTimeBooking)
export class FirstTimeBookingCondition implements AwardConditionsHandler<any, ActorAwardDescriptor> {
  async isEligible(awardCampaign: AwardCampaignEntity, target: any, awardDescriptor: ActorAwardDescriptor) {
    /* In this case, determine if the referee (i.e. the patient booking the appointment) has completed their very first
     * appointment through this medium. */

    /* Should include only one appointment (i.e. the appointment just completed) */
    const totalAppointments = await getRepository(AppointmentEntity).count({
      where: {
        patient: awardDescriptor.getActor(),
        status: Not(AppointmentStatus.Cancelled),
      }
    });

    return totalAppointments === 1;
  }
}
