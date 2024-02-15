import { Type } from 'class-transformer';
import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';
import { enumValues } from '../../../../common/enum.utils';
import { PlaceSessionTokenDto } from './place-session-token.dto';
import { PlaceAutocompleteType } from "@googlemaps/google-maps-services-js";

export enum Countries {
  UNITED_STATES = 'us',
}

export class PlaceAutocompleteDto extends PlaceSessionTokenDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsIn(enumValues(Countries))
  country: Countries;

  @IsOptional()
  @IsNumberString()
  lat?: number;

  @IsOptional()
  @IsNumberString()
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  radius?: number;

  @IsOptional()
  @IsString()
  @IsIn(enumValues(PlaceAutocompleteType))
  types: string = PlaceAutocompleteType.address;
}
