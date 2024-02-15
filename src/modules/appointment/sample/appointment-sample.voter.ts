import { Inject, Injectable } from '@nestjs/common';
import { isUserType } from '../../../common/user.utils';
import { AppointmentSampleEntity } from '../../../entities/appointment-sample.entity';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { SpecialistUser, StaffUser, User } from '../../../entities/user.entity';
import {
  SECURITY_ATTR_CREATE,
  SECURITY_ATTR_LIST,
  SECURITY_ATTR_MODIFY,
  SECURITY_ATTR_READ,
} from '../../core/security/security-voter.const';
import { SecurityVoter } from '../../core/security/security-voter.decorator';
import { Voter } from '../../core/security/voter';
import { SecurityVoterService } from '../../core/services/security-voter.service';

@Injectable()
@SecurityVoter(AppointmentSampleEntity)
export class AppointmentSampleVoter extends Voter(AppointmentSampleEntity) {
  @Inject()
  private readonly security: SecurityVoterService;

  async voteOnAttribute(subject: AppointmentSampleEntity, attr: string, user: User) {
    // Load entity with appointment relation since it is not loaded by default
    // subject = await this.load(subject, { relations: ['appointment'] });

    // TODO: Enhance security around which specialists can read and modify samples

    switch (attr) {
      case SECURITY_ATTR_CREATE:
        return isUserType(StaffUser, user);
      case SECURITY_ATTR_LIST:
        return false;
      case SECURITY_ATTR_READ:
      case SECURITY_ATTR_MODIFY:
        return isUserType([StaffUser, SpecialistUser], user);
    }

    return false;
  }

  // ---

  private async isGranted(entity: AppointmentEntity, attrs: string | string[], user: User) {
    return await this.security.isGranted(AppointmentEntity, entity, attrs, user, true);
  }
}
