import { Injectable } from '@nestjs/common';
import { isSameEntity } from '../../common/entity.utils';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { isUserType } from '../../common/user.utils';
import { PatientUser, SpecialistUser, StaffUser, User } from '../../entities/user.entity';
import { AppointmentEntity } from '../../entities/appointment.entity';
import { SECURITY_ATTR_CREATE, SECURITY_ATTR_LIST, SECURITY_ATTR_MODIFY, SECURITY_ATTR_READ } from '../core/security/security-voter.const';
import { SecurityVoter } from '../core/security/security-voter.decorator';
import { Voter } from '../core/security/voter';

export const SECURITY_ATTR_MODIFY_SAMPLE = 'modify-sample';
export const SECURITY_ATTR_MODIFY_STATUS = 'modify-status';
export const SECURITY_ATTR_CANCEL = 'cancel';
export const SECURITY_ATTR_RESCHEDULE = 'reschedule';

@Injectable()
@SecurityVoter(AppointmentEntity)
export class AppointmentVoter extends Voter(AppointmentEntity) {
  async voteOnAttribute(subject: Partial<AppointmentEntity>, attr: string, user: User) {
    subject = await this.preload(subject);

    // TODO: Enhance security around which specialists can read and modify appointments

    switch (attr) {
      case SECURITY_ATTR_CREATE:
        return isUserType([PatientUser], user);
      case SECURITY_ATTR_LIST:
        return isUserType([PatientUser, SpecialistUser, StaffUser], user);
      case SECURITY_ATTR_READ:
        return isSameEntity(subject.patient, user) || isUserType([SpecialistUser, StaffUser], user);
      case SECURITY_ATTR_MODIFY:
        return isUserType(StaffUser, user);
      case SECURITY_ATTR_MODIFY_SAMPLE:
        return isSameEntity(subject.specialist, user) || isUserType(StaffUser, user);
      case SECURITY_ATTR_MODIFY_STATUS:
        // TODO: Limit this to only specific statuses for specialists
        return isSameEntity(subject.specialist, user) || isUserType(StaffUser, user);
      case SECURITY_ATTR_RESCHEDULE:
        /* Patients may only rebook their own appointments if they are within the rebooking window, and the appointment is either
         * pending or confirmed. */
        return (
          (isSameEntity(subject.patient, user) &&
            subject.isRefundable() &&
            [AppointmentStatus.Pending, AppointmentStatus.Confirmed].includes(subject.status)) ||
          isUserType(StaffUser, user)
        );
      case SECURITY_ATTR_CANCEL:
        return isSameEntity(subject.patient, user) || isUserType(StaffUser, user);
    }

    return false;
  }
}
