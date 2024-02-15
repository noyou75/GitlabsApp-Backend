import { Exclude } from 'class-transformer';
import { PatientUser, User, SpecialistUser, StaffUser } from '../entities/user.entity';

@Exclude()
export abstract class OwnedEntity {
  // The following fields should be added to the child class an annotated with @ManyToOne()
  patient?: PatientUser;
  specialist?: SpecialistUser;
  staff?: StaffUser;

  get user(): User {
    return this.patient || this.specialist || this.staff;
  }

  set user(user: User) {
    // Use "if" type guards until switch or constructor type guards are supported
    // See: https://github.com/Microsoft/TypeScript/issues/23274

    if (user instanceof PatientUser) {
      this.patient = user;
    } else if (user instanceof SpecialistUser) {
      this.specialist = user;
    } else if (user instanceof StaffUser) {
      this.staff = user;
    } else {
      throw new TypeError(`Unsupported User type: ${user.constructor.name}`);
    }
  }
}
