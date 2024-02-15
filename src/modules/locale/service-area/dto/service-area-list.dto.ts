import { IsOptional, IsUUID } from 'class-validator';

export class ServiceAreaListDto {
  @IsOptional()
  @IsUUID()
  market: string;
}
