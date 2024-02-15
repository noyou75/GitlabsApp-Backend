import { Type } from '@nestjs/common';

import { PatientUser, SpecialistUser, StaffUser, User } from '../../entities/user.entity';

const types = { PatientUser, SpecialistUser, StaffUser };

export class UserFactory {
  static getClassType(type: string): Type<User> {
    if (!types[type]) {
      throw new Error(`"${type}" is not a valid User class type`);
    }
    return types[type];
  }
}
