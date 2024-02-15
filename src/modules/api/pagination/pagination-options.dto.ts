import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Default } from '../../../common/default.decorator';

export class PaginationOptionsDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  @Default(25)
  limit?: number = 25;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Default(0)
  offset?: number = 0;
}
