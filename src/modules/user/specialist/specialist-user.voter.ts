import { Injectable } from '@nestjs/common';
import { isSameEntity } from '../../../common/entity.utils';
import { isUserType } from '../../../common/user.utils';
import { SpecialistUser, StaffUser, User } from '../../../entities/user.entity';
import {
  SECURITY_ATTR_CREATE,
  SECURITY_ATTR_LIST,
  SECURITY_ATTR_MODIFY,
  SECURITY_ATTR_READ,
} from '../../core/security/security-voter.const';
import { SecurityVoter } from '../../core/security/security-voter.decorator';
import { Voter } from '../../core/security/voter';

@Injectable()
@SecurityVoter(SpecialistUser)
export class SpecialistUserVoter extends Voter(SpecialistUser) {
  async voteOnAttribute(subject: Partial<SpecialistUser>, attr: string, user: User) {
    subject = await this.preload(subject);

    switch (attr) {
      case SECURITY_ATTR_LIST:
      case SECURITY_ATTR_CREATE:
        return isUserType(StaffUser, user);
      case SECURITY_ATTR_READ:
      case SECURITY_ATTR_MODIFY:
        return isSameEntity(subject, user) || isUserType(StaffUser, user);
    }

    return false;
  }
}
