import { Exclude, Expose, plainToClass, Transform } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { DateRangeEmbed } from '../../../entities/embed/date-range.embed';
import { SearchParams } from '../../api/crud/search.params';

@Exclude()
export class AppointmentListDto extends SearchParams {
  @IsOptional()
  @ValidateNested()
  @Transform(val => val && plainToClass(DateRangeEmbed, JSON.parse(decodeURIComponent(val))))
  @Expose()
  range?: DateRangeEmbed;
}
