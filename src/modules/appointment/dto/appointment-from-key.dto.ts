import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInstance,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { enumValues } from '../../../common/enum.utils';
import { LabCompany } from '../../../common/enums/lab-company.enum';
import { numeric } from '../../../common/string.utils';
import { LabOrderSeedTypes } from '../../../entities/lab-order-details.entity';
import { IsExactLength } from '../../shared/constraints/is-exact-length.constraint';

export class LabOrderDetailsDto {
  // TODO: Refactor this now that we have a solid understanding of the booking process and what information is needed from the patient

  @IsOptional()
  @IsNotEmpty({ groups: [LabOrderSeedTypes.File.type] })
  @Expose()
  labOrderIds?: Array<string>;

  @IsOptional()
  @IsNotEmpty({ groups: [LabOrderSeedTypes.DoctorContact.type] })
  @Expose()
  contactName?: string;

  @IsOptional()
  @IsNumberString({ no_symbols: true }, { groups: [LabOrderSeedTypes.DoctorContact.type] })
  @IsExactLength(10, { groups: [LabOrderSeedTypes.DoctorContact.type] })
  @Transform((value) => (value ? numeric(value) : undefined), { toClassOnly: true })
  @Expose()
  contactPhone?: string;

  @IsOptional({ always: true })
  @IsIn(enumValues(LabCompany), { groups: [LabOrderSeedTypes.DoctorContact.type] })
  @Expose()
  lab?: LabCompany;

  @IsOptional()
  @IsBoolean({ groups: [LabOrderSeedTypes.DoctorSubmit.type] })
  @Expose()
  isGetFromDoctor?: boolean;

  /* Unfortunately necessary to expose these fields as part of the DTO - when we rebook appointments, we will have no other means of knowing
   * which new LabOrderDetailsDto object corresponds to that of the rebooked appointment. */
  @IsOptional()
  @IsString()
  @Expose()
  abnDocumentId?: string;

  @IsOptional()
  @IsString()
  @Expose()
  accuDrawId?: string;

  /* Exists almost entirely for the sake of the rebooking operation */
  @IsOptional()
  @Expose()
  ordinal?: number;

  @IsOptional()
  @IsBoolean()
  @Expose()
  hasLabOrder?: boolean;
}

@Exclude()
export class AppointmentFromKeyDto {
  @IsNotEmpty({ always: true })
  @Expose()
  key: string;

  @IsNotEmpty({ always: true })
  @Expose()
  paymentIntentId: string;

  @IsOptional()
  @Expose()
  coupon?: string; // TODO: Move this to the payment intent

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => LabOrderDetailsDto)
  @IsInstance(LabOrderDetailsDto, { each: true })
  @ValidateNested({ each: true })
  @Expose()
  @Transform(
    (labOrderDetailsDtos: LabOrderDetailsDto[]) => {
      labOrderDetailsDtos.forEach((labOrderDetailsDto, index) => {
        /* Assign an ordinal based on the current index, if one is not already supplied. It is unfortunately not possible to do this through
         * TypeORM queries automatically =\
         * See: https://github.com/typeorm/typeorm/issues/2620 */
        labOrderDetailsDto.ordinal = labOrderDetailsDto.ordinal ?? index;
      });

      return labOrderDetailsDtos;
    },
    {
      toClassOnly: true,
    },
  )
  labOrderDetails: LabOrderDetailsDto[]; // TODO: Validate lab order is uploaded if this is a priority slot

  @IsOptional()
  @IsBoolean()
  @Expose()
  isMedicare?: boolean; // TODO: Remove since medicare is calculated from age
}
