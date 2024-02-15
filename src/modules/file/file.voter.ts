import { Injectable } from '@nestjs/common';
import { isSameEntity } from '../../common/entity.utils';
import { FilePurpose } from '../../common/enums/file-purpose.enum';
import { isUserType } from '../../common/user.utils';
import { FileEntity } from '../../entities/file.entity';
import { PatientUser, SpecialistUser, StaffUser, User } from '../../entities/user.entity';
import { SECURITY_ATTR_CREATE, SECURITY_ATTR_MODIFY, SECURITY_ATTR_READ } from '../core/security/security-voter.const';
import { SecurityVoter } from '../core/security/security-voter.decorator';
import { Voter } from '../core/security/voter';

@Injectable()
@SecurityVoter(FileEntity)
export class FileVoter extends Voter(FileEntity) {
  async voteOnAttribute(subject: Partial<FileEntity>, attr: string, user: User) {
    if (this.hasId(subject) && !subject.user) {
      subject = await this.getRepository().findOneOrFail(subject.id, { relations: ['patient', 'specialist', 'staff'] });
    }

    switch (attr) {
      case SECURITY_ATTR_CREATE:
        return true;
      case SECURITY_ATTR_READ:
        switch (subject.purpose) {
          case FilePurpose.Avatar:
            return true;
          case FilePurpose.Signature:
            return isSameEntity(subject.user, user) || isUserType([StaffUser], user);
          case FilePurpose.LabOrder:
            return isSameEntity(subject.user, user) || isUserType([StaffUser, SpecialistUser], user);
          case FilePurpose.InsuranceFront:
            if (user instanceof PatientUser && isSameEntity(user.insurance.front, subject)) {
              return true;
            }
            return isSameEntity(subject.user, user) || isUserType([SpecialistUser, StaffUser], user);
          case FilePurpose.InsuranceRear:
            if (user instanceof PatientUser && isSameEntity(user.insurance.rear, subject)) {
              return true;
            }
            return isSameEntity(subject.user, user) || isUserType([SpecialistUser, StaffUser], user);
          case FilePurpose.AppointmentDeliveryForm:
            return isUserType([SpecialistUser, StaffUser], user);
          default:
            // TODO: Make Specialist/Staff part smarter to only include upcoming or recent appointments
            return isSameEntity(subject.user, user) || isUserType([SpecialistUser, StaffUser], user);
        }
      case SECURITY_ATTR_MODIFY:
        return subject.purpose === FilePurpose.LabOrder && isSameEntity(subject.user, user);
    }

    return false;
  }
}
