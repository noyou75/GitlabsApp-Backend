import { Exclude, Expose, Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { enumValues } from '../../../common/enum.utils';
import { CreditSourceEnum } from '../../../common/enums/credit-source.enum';
import { DateRangeEmbed } from '../../../entities/embed/date-range.embed';

@Exclude()
export class IssueCreditDto {
  @IsNumber()
  @IsPositive()
  @Expose()
  public amount: number;

  @IsIn(enumValues(CreditSourceEnum))
  @Expose()
  public source: CreditSourceEnum;

  @Type(() => DateRangeEmbed)
  @IsOptional()
  @Expose()
  public validDateRange?: DateRangeEmbed;

  @IsOptional()
  @IsString()
  @Expose()
  public notes?: string;
}
