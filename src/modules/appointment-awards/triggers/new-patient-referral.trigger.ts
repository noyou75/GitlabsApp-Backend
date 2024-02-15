import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { AwardTriggersEnum } from '../../../common/enums/award-triggers.enum';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { AwardTrigger, AwardTriggerHandler } from '../../awards/services/award-trigger.service';
import { EntityLifecycleEventTypes } from '../../entity/services/entity-subscriber.service';

@AwardTrigger(AppointmentEntity, EntityLifecycleEventTypes.Updated, AwardTriggersEnum.AppointmentCompletion)
export class NewPatientReferralTrigger implements AwardTriggerHandler<AppointmentEntity> {
  async isTriggered(newEntity: AppointmentEntity, oldEntity) {
    /* The new patient referral trigger invokes when an appointment has been completed. */
    return newEntity.status === AppointmentStatus.Completed && newEntity.status !== oldEntity.status;
  }
}
