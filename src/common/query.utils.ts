import { Type } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { PatientUser, SpecialistUser, StaffUser, User } from '../entities/user.entity';
import { secureid } from './string.utils';

export const filterQueryByUser = <E>(qb: SelectQueryBuilder<E>, forUserTypes: Type<User>[], user: User) => {
  // TODO: This function can probably be made a little smarter

  if (forUserTypes.some(type => user instanceof type)) {
    function addWhere(relation: string) {
      const alias = secureid();
      const param = secureid();
      qb.leftJoin(`${qb.alias}.${relation}`, alias);
      qb.andWhere(`${alias}.id = :${param}`, { [param]: user.id });
    }

    switch (true) {
      case user instanceof PatientUser:
        addWhere('patient');
        break;
      case user instanceof SpecialistUser:
        addWhere('specialist');
        break;
      case user instanceof StaffUser:
        addWhere('staff');
        break;
    }
  }
};
