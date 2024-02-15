import { Exclude, Expose, Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { getRepository } from 'typeorm';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { SpecialistUser } from '../../../entities/user.entity';

/**
 * DTO that contains the details of a resource scheduling availability query
 */
@Exclude()
export class AvailabilityQueryDto {
  @Expose()
  timezone?: string;

  @Transform((value) => (value ? getRepository(SpecialistUser).findOne(value) : Promise.resolve(undefined)))
  @IsOptional()
  @Expose()
  specialist?: Promise<SpecialistUser | undefined>;

  @Transform((value) => (value ? getRepository(AppointmentEntity).findOne(value) : Promise.resolve(undefined)))
  @IsOptional()
  @Expose()
  appointment?: Promise<AppointmentEntity | undefined>;
}
