import { Injectable, Type } from '@nestjs/common';
import { FindOneOptions, Repository } from 'typeorm';
import { PatientUser, SpecialistUser, StaffUser, User } from '../../entities/user.entity';
import { ICrudService } from '../api/crud/crud.service';
import { PatientUserService } from './patient/patient-user.service';
import { SpecialistUserService } from './specialist/specialist-user.service';
import { StaffUserService } from './staff/staff-user.service';

@Injectable()
export class UserService {
  constructor(
    private readonly patients: PatientUserService,
    private readonly specialsts: SpecialistUserService,
    private readonly staff: StaffUserService,
  ) {}

  async findOne(type: Type<User>, id?: string, options?: FindOneOptions<User>): Promise<User>;
  async findOne(type: Type<User>, options?: FindOneOptions<User>): Promise<User>;
  async findOne(type: Type<User>, optionsOrId?: string | FindOneOptions<User>, maybeOptions?: FindOneOptions<User>): Promise<User> {
    return await this.getRepository(type).findOne(optionsOrId as any, maybeOptions);
  }

  // TODO: Add proper types here instead of any once Typescript supports high kinded types
  // See: https://github.com/microsoft/TypeScript/issues/1213
  getService(type: Type<User>): ICrudService<any, Repository<any>> {
    switch (type) {
      case PatientUser:
        return this.patients;
      case SpecialistUser:
        return this.specialsts;
      case StaffUser:
        return this.staff;
      default:
        throw new TypeError(`Unsupported User type: ${type.name}`);
    }
  }

  getRepository(type: Type<User>): Repository<User> {
    return this.getService(type).getRepository();
  }
}
