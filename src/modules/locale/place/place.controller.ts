import { PlaceAutocompleteType } from '@googlemaps/google-maps-services-js';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { MappingService } from '../../core/services/mapping.service';
import { PlaceAutocompleteDto } from './dto/place-autocomplete.dto';
import { PlaceSessionTokenDto } from './dto/place-session-token.dto';
import { filterNullish } from '../../shared/util/object.util';

@Controller('place')
export class PlaceController {
  constructor(private readonly maps: MappingService) {}

  @Get('autocomplete')
  async autcomplete(@Query() dto: PlaceAutocompleteDto) {
    return this.maps.autocomplete(
      dto.query,
      dto.sessionToken,
      filterNullish({
        location: dto.lat && dto.lng ? { lat: dto.lat, lng: dto.lng } : null,
        components: dto.country && [`country:${dto.country}`],
        radius: dto.radius,
        types: dto.types,
      }),
    );
  }

  @Get(':id/details')
  async details(@Query() dto: PlaceSessionTokenDto, @Param('id') id: string) {
    return this.maps.place(id, dto.sessionToken);
  }
}
