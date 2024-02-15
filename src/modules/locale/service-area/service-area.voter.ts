import { Injectable } from '@nestjs/common';
import { isUserType } from '../../../common/user.utils';
import { ServiceAreaEntity } from '../../../entities/service-area.entity';
import { StaffUser, User } from '../../../entities/user.entity';
import {
  SECURITY_ATTR_CREATE,
  SECURITY_ATTR_LIST,
  SECURITY_ATTR_MODIFY,
  SECURITY_ATTR_READ,
} from '../../core/security/security-voter.const';
import { SecurityVoter } from '../../core/security/security-voter.decorator';
import { Voter } from '../../core/security/voter';

@Injectable()
@SecurityVoter(ServiceAreaEntity)
export class ServiceAreaVoter extends Voter(ServiceAreaEntity) {
  async voteOnAttribute(subject: Partial<ServiceAreaEntity>, attr: string, user: User) {
    switch (attr) {
      case SECURITY_ATTR_READ:
        return true;
      case SECURITY_ATTR_CREATE:
      case SECURITY_ATTR_LIST:
      case SECURITY_ATTR_MODIFY:
        return isUserType([StaffUser], user);
    }
    return false;
  }
}
