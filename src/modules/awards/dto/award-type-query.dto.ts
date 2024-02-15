import { Exclude, Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

@Exclude()
export class AwardTypeQueryDto {
  @IsOptional()
  @IsString()
  @Expose()
  public name: string;
}
