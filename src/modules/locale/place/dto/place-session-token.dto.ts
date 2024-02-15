import { IsString } from 'class-validator';

export class PlaceSessionTokenDto {
  @IsString()
  sessionToken: string;
}
