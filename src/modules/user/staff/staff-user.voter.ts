import { Injectable } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { isSameEntity } from '../../../common/entity.utils';
import { isAdministrator } from '../../../common/user.utils';
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
@SecurityVoter(StaffUser)
export class StaffUserVoter extends Voter(StaffUser) {
  async voteOnAttribute(subject: DeepPartial<StaffUser>, attr: string, user: User) {
    subject = await this.preload(subject);

    switch (attr) {
      case SECURITY_ATTR_CREATE:
      case SECURITY_ATTR_LIST:
        return isAdministrator(user);
      case SECURITY_ATTR_READ:
      case SECURITY_ATTR_MODIFY:
        return isSameEntity(subject, user) || isAdministrator(user);
    }

    return false;
  }
}
