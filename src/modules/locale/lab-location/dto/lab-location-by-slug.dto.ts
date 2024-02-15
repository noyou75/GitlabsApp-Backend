import { IsIn, IsOptional, IsString } from 'class-validator';
import { enumValues } from '../../../../common/enum.utils';
import { LabCompany } from '../../../../common/enums/lab-company.enum';

export class LabLocationBySlugDto {
  @IsOptional()
  @IsIn(enumValues(LabCompany))
  lab: LabCompany;

  @IsString()
  slug: string;
}
