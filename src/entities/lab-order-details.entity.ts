import { Exclude, Expose, Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNumberString, IsOptional, ValidateIf } from 'class-validator';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm';
import { enumValues } from '../common/enum.utils';
import { LabCompany } from '../common/enums/lab-company.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { numeric } from '../common/string.utils';
import { IsExactLength } from '../modules/shared/constraints/is-exact-length.constraint';
import { Filterable } from '../modules/shared/decorators/filterable.decorator';
import { AppointmentEntity } from './appointment.entity';
import { FileEntity } from './file.entity';

/**
 * Describes a form of lab order provisioning as selected by the patient during the booking process.
 */
export class LabOrderSeedTypes {
  constructor(public type: string, public isActive: (labOrderDetailsEmbed: LabOrderDetailsEntity) => boolean) {
    this.type = `LabOrderSeedType:${type}`;
  }

  /**
   * Describes the subworkflow where the patient provides their lab order immediately during the booking process.
   */
  public static readonly File = new LabOrderSeedTypes('File', () => {
    /* Not currently used; however, this may be coming back soon, so let's not remove this just yet. */
    return false;
  });

  /**
   * Describes the subworkflow where the patient elects to have us contact their doctor to retrieve their lab order.
   */
  public static readonly DoctorContact = new LabOrderSeedTypes('DoctorContact', (labOrderDetailsEmbed) => {
    // Must use the affirmative in this case, as this seed type will eventually have a file...
    return !labOrderDetailsEmbed.isGetFromDoctor;
  });

  /**
   * Describes the subworkflow where the patient elects to have the doctor submit their lab order.
   */
  public static readonly DoctorSubmit = new LabOrderSeedTypes('DoctorSubmit', (labOrderDetailsEmbed) => {
    // Must use the affirmative in this case, as this seed type will eventually have a file
    return !!labOrderDetailsEmbed.isGetFromDoctor;
  });

  static *[Symbol.iterator](): Generator<LabOrderSeedTypes> {
    for (const lostKey of Object.keys(LabOrderSeedTypes)) {
      if (lostKey !== 'ctorParameters') {
        yield LabOrderSeedTypes[lostKey];
      }
    }
  }
}

@Entity({
  name: 'lab_order_details',
})
@Exclude()
export class LabOrderDetailsEntity {
  /* TODO we are currently exposing ID on write (as part of the AppointmentEntity update CRUD operation) to get around the sticky
   *  fact that this is going to be hard to update otherwise.  However, this REALLY should be avoided.  The likely solution would
   *  probably include some delegation to a LabOrderDetailsService and/or Controller components that can handle this task under
   *  its own purview.  However, we can't rely on a solution that would receive ID-less values from the front end, as there is a bug
   *  / limitation in TypeORM where you cannot order relation entities through the findOne method.  These values are returned by their
   *  database sequence naturally, unless you decide to introduce a 'relation' option param to that findOne method call, where they
   *  are suddenly ordered by updated_at.  This can be resolved by using query builder, but due to the pervasive nature of how
   *  CrudService is leveraged, I've decided to wait on updating this logic until I can battle test it appropriately.
   *  See https://github.com/typeorm/typeorm/issues/2620 for more details. */
  @PrimaryGeneratedColumn('uuid')
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  id: string;

  @Column({
    nullable: true,
  })
  @Expose()
  @ValidateIf(LabOrderSeedTypes.DoctorContact.isActive)
  contactName: string;

  @Column({
    nullable: true,
  })
  @Expose()
  @IsOptional()
  @IsNumberString()
  @IsExactLength(10)
  @Transform((value) => (value ? numeric(value) : undefined), { toClassOnly: true })
  @ValidateIf(LabOrderSeedTypes.DoctorContact.isActive)
  contactPhone: string;

  @Column({ type: 'enum', enum: LabCompany, nullable: true })
  @IsOptional()
  @IsIn(enumValues(LabCompany))
  @Expose()
  @ValidateIf(LabOrderSeedTypes.DoctorContact.isActive)
  lab: LabCompany;

  @Filterable()
  @ManyToMany(() => FileEntity, { eager: true, cascade: true, onDelete: 'CASCADE' })
  @JoinTable({
    name: 'appointment_lab_order_file_assoc',
  })
  @IsArray()
  @ValidateIf(LabOrderSeedTypes.File.isActive)
  @Expose({ groups: [UserRole.Staff, UserRole.Specialist] })
  @Transform((labOrderFiles: FileEntity[]) => labOrderFiles.filter((labOrderFile) => !labOrderFile.isDeleted), { toPlainOnly: true })
  labOrderFiles: Array<FileEntity>;

  @Column({ nullable: true })
  @IsBoolean()
  @Expose()
  @ValidateIf(LabOrderSeedTypes.DoctorSubmit.isActive)
  isGetFromDoctor: boolean;

  @Column()
  @IsBoolean()
  @Expose()
  hasLabOrder: boolean;

  @ManyToOne(() => AppointmentEntity, (appointment) => appointment.labOrderDetails, { nullable: false })
  @Expose({
    toClassOnly: true,
  })
  appointment: AppointmentEntity;

  @RelationId('appointment')
  appointmentId: string;

  @ManyToOne(() => FileEntity, { eager: true, onDelete: 'SET NULL' })
  @IsOptional()
  @Expose()
  abnDocument?: FileEntity;

  @ManyToOne(() => FileEntity, { eager: true, onDelete: 'SET NULL' })
  @IsOptional()
  @Expose()
  accuDraw?: FileEntity;

  @Column({
    nullable: false,
    default: 0,
  })
  @Expose({ toClassOnly: true })
  ordinal: number;

  @Column({
    default: false,
  })
  @IsOptional()
  @Expose()
  isDeleted: boolean;

  /**
   * Determines the type of lab order provisioning subworkflow that is currently active on this object.
   */
  getLabOrderType(): LabOrderSeedTypes {
    for (const labOrderSeedType of LabOrderSeedTypes) {
      if (labOrderSeedType.isActive(this)) {
        return labOrderSeedType;
      }
    }

    /* If we get here, then we're in an invalid state. */
    throw new Error('[LabOrderDetailsEntity] Cannot determine lab order type - LabOrderDetailsEmbed is in an invalid state.');
  }
}
