import { IsNumberString, IsOptional, IsString } from 'class-validator';
import { LabCompany } from '../../../../common/enums/lab-company.enum';
import { IsExactLength } from '../../../shared/constraints/is-exact-length.constraint';

export class LabLocationByAddressDto {
  @IsNumberString()
  @IsExactLength(5)
  zipCode: LabCompany;

  @IsString()
  @IsOptional()
  street?: string;
}
