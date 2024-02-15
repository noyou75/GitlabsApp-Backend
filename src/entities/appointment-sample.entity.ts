import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, Max, Min, ValidateIf } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm';
import { enumValues } from '../common/enum.utils';
import { AppointmentSampleUncollectedReasonEnum } from '../common/enums/appointment-sample-uncollected-reason.enum';
import { AppointmentSampleUnprocessedReasonEnum } from '../common/enums/appointment-sample-unprocessed-reason.enum';
import { LabSampleProcessing, LabSampleTemperature, LabSampleType } from '../common/enums/lab-sample.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { AppointmentEntity } from './appointment.entity';

@Entity({
  name: 'appointment_sample',
})
@Exclude()
export class AppointmentSampleEntity {
  // TODO: IDs should not be writeable here as it could have unintended consequences, this needs to be investigated further.
  //       We also transform nullish IDs to undefined here, as any other nullish value will be attempted to be written
  //       to the database and fail. Need to find a better solution for that.

  @PrimaryGeneratedColumn('uuid')
  @Transform((value) => value ?? undefined)
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  id: string;

  @ManyToOne(() => AppointmentEntity, (appointment) => appointment.samples, { nullable: false })
  @Expose({ toClassOnly: true, groups: [UserRole.Staff] })
  appointment: AppointmentEntity;

  @RelationId('appointment')
  appointmentId: string;

  @Column({ type: 'enum', enum: LabSampleType })
  @IsIn(enumValues(LabSampleType))
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  type: string;

  @Column()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  quantity: number;

  @Column({ type: 'enum', enum: LabSampleTemperature })
  @IsIn(enumValues(LabSampleTemperature))
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  temperature: string;

  @Column({ type: 'enum', enum: LabSampleProcessing })
  @IsIn(enumValues(LabSampleProcessing))
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  processing: string;

  @Column({ default: false })
  @IsOptional()
  @IsBoolean()
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  suppliesVerified?: boolean;

  private _collected: boolean;

  @Column({ default: false })
  @IsOptional()
  @IsBoolean()
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  get collected(): boolean {
    return this._collected;
  }

  set collected(value: boolean) {
    this._collected = value;

    if (this._collected) {
      this.uncollectedReason = null;
      this.uncollectedNote = null;
    } else {
      this.processed = false;
    }
  }

  private _uncollectedReason: string | null;

  @Column({ nullable: true, type: 'enum', enum: AppointmentSampleUncollectedReasonEnum })
  @IsOptional()
  @IsIn(enumValues(AppointmentSampleUncollectedReasonEnum))
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  get uncollectedReason(): string | null {
    return this._uncollectedReason;
  }

  set uncollectedReason(reason) {
    this._uncollectedReason = reason;

    if (this._uncollectedReason) {
      this.collected = false;
      this.processed = false;
    }
  }

  private _uncollectedNote: string | null;

  @Column({ nullable: true })
  @ValidateIf((o) => o.uncollectedReason === AppointmentSampleUncollectedReasonEnum.Other)
  @IsNotEmpty()
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  get uncollectedNote(): string | null {
    return this._uncollectedNote;
  }

  set uncollectedNote(note) {
    this._uncollectedNote = note;

    if (this._uncollectedNote) {
      this.collected = false;
    }
  }

  private _processed: boolean;

  @Column({ default: false })
  @IsOptional()
  @IsBoolean()
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  get processed(): boolean {
    return this._processed;
  }

  set processed(value: boolean) {
    this._processed = value;

    if (this._processed) {
      this.unprocessedReason = null;
      this.unprocessedNote = null;
    }
  }

  private _unprocessedReason: string | null;

  @Column({ nullable: true, type: 'enum', enum: AppointmentSampleUnprocessedReasonEnum })
  @IsOptional()
  @IsIn(enumValues(AppointmentSampleUnprocessedReasonEnum))
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  get unprocessedReason(): string | null {
    return this._unprocessedReason;
  }

  set unprocessedReason(reason) {
    this._unprocessedReason = reason;

    if (this._unprocessedReason) {
      this.processed = false;
    }
  }

  private _unprocessedNote: string | null;

  @Column({ nullable: true })
  @ValidateIf((o) => o.unprocessedReason === AppointmentSampleUnprocessedReasonEnum.Other)
  @IsNotEmpty()
  @Expose({ groups: [UserRole.Specialist, UserRole.Staff] })
  get unprocessedNote(): string | null {
    return this._unprocessedNote;
  }

  set unprocessedNote(note) {
    this._unprocessedNote = note;

    if (this._unprocessedNote) {
      this.processed = false;
    }
  }

  constructor(init?: Partial<AppointmentSampleEntity>) {
    Object.assign(this, init);
  }
}
