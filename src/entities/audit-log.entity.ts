import { Exclude, Expose } from 'class-transformer';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AuditLogAction, AuditLogResource } from '../common/enums/audit-log.enum';
import { PatientUser, SpecialistUser, StaffUser, User } from './user.entity';

@Entity({
  name: 'audit_log',
})
@Index(['resource', 'identifier'])
@Exclude()
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose({ toPlainOnly: true })
  id: string;

  @Column({ type: 'enum', enum: AuditLogResource })
  @Expose({ toPlainOnly: true })
  resource: AuditLogResource;

  @Column()
  identifier: string;

  @Column({ type: 'enum', enum: AuditLogAction })
  @Expose({ toPlainOnly: true })
  action: AuditLogAction;

  @ManyToOne(() => PatientUser)
  patient: PatientUser;

  @ManyToOne(() => SpecialistUser)
  specialist: SpecialistUser;

  @ManyToOne(() => StaffUser)
  staff: StaffUser;

  @CreateDateColumn()
  @Expose({ toPlainOnly: true })
  createdAt: Date;

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
