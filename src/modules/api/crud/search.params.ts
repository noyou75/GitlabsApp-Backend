import { Exclude, Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

@Exclude()
export class SearchParams {
  @IsOptional()
  @IsString()
  @Expose()
  search: string;
}
