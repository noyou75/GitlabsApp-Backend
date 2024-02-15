import {
  Client as GoogleMapsClient,
  GeocodeResult,
  LatLng,
  Place,
  PlaceAutocompleteResult,
  PlaceAutocompleteType,
  AddressType,
  GeocodingAddressComponentType
} from '@googlemaps/google-maps-services-js';
import { Injectable } from '@nestjs/common';
import { GCPConfig } from '../enums/config.enum';
import { ConfigService } from './config.service';
import { AddressEmbed } from '../../../entities/embed/address.embed';

// This should be part of the google maps library, but is not exposed...
export interface PlaceAutocompleteExtras {
  location?: { lat: number; lng: number };
  components?: string[];
  radius?: number;
  types?: PlaceAutocompleteType;
}

@Injectable()
export class MappingService {
  client: GoogleMapsClient;
  key: string;

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleMapsClient();
    this.key = config.get(GCPConfig.ApiKey);
  }

  async geocode(address: string): Promise<GeocodeResult[]> {
    try {
      const geocoding = await this.client.geocode({
        params: {
          key: this.key,
          address: String(address),
          components: {
            country: 'US',
          },
        },
      });
      return geocoding.data.results;
    } catch (e) {
      throw new Error(`Geocoding Error: ${e.response.data.status}, message: ${e.response.data.error_message}, address: ${address}`);
    }
  }

  async autocomplete(input: string, sessionToken: string, extra?: PlaceAutocompleteExtras): Promise<PlaceAutocompleteResult[]> {
    try {
      const places = await this.client.placeAutocomplete({
        params: {
          key: this.key,
          input,
          sessiontoken: sessionToken, // Who doesn't use camel case for property names...? *OCD triggered*
          ...extra,
        },
      });

      return places.data.predictions;
    } catch (e) {
      throw new Error(
        `Place Autocomplete Error: ${e.response.data.status}, message: ${
          e.response.data.error_message
        }, input: ${input}, token: ${sessionToken}, extra: ${JSON.stringify(extra)}`,
      );
    }
  }

  async places(query: string): Promise<Place[]> {
    try {
      const places = await this.client.textSearch({
        params: {
          key: this.key,
          query,
        },
      });

      return places.data.results;
    } catch (e) {
      throw new Error(`Places Error: ${e.response.data.status}, message: ${e.response.data.error_message}, query: ${query}`);
    }
  }

  async place(id: string, sessionToken?: string): Promise<Place> {
    try {
      const place = await this.client.placeDetails({
        params: {
          key: this.key,
          place_id: id,
          sessiontoken: sessionToken,
          fields: [
            'place_id',
            'name',
            'address_components',
            'formatted_address',
            'geometry/location',
            'international_phone_number',
            'opening_hours',
            'types'
          ],
        },
      });

      return place.data.result;
    } catch (e) {
      throw new Error(`Place Details Error: ${e.response.data.status}, message: ${e.response.data.error_message}, place id: ${id}`);
    }
  }

  getPlaceAddressComponent(place: Place, type: AddressType | GeocodingAddressComponentType, namePreference: 'short_name' | 'long_name' = 'short_name'): string {
    const component = place.address_components.find(v => v.types.includes(type));
    if (!component) {
      return null;
    }
    return component[namePreference] || component[namePreference === 'short_name' ? 'long_name' : 'short_name'];
  }

  placeToAddress(place: Place, unit: string = null): AddressEmbed {
    const address = new AddressEmbed();
    address.street = `${this.getPlaceAddressComponent(place, GeocodingAddressComponentType.street_number) || ''} ${this.getPlaceAddressComponent(place, AddressType.route) || ''}`.trim();
    address.city = this.getPlaceAddressComponent(place, AddressType.locality, 'long_name');
    address.state = this.getPlaceAddressComponent(place, AddressType.administrative_area_level_1);
    address.zipCode = this.getPlaceAddressComponent(place, AddressType.postal_code);
    address.unit = unit || this.getPlaceAddressComponent(place, AddressType.subpremise);
    address.geo = {
      type: 'Point',
      coordinates: [place.geometry.location.lng, place.geometry.location.lat],
    };
    return address;
  }

  async timezone(location: LatLng) {
    try {
      const timezone = await this.client.timezone({
        params: {
          key: this.key,
          timestamp: new Date(),
          location,
        },
      });

      return timezone.data;
    } catch (e) {
      throw new Error(`Timezone Error: ${e.response.data.status}, message: ${e.response.data.error_message}, location: ${location}`);
    }
  }
}
