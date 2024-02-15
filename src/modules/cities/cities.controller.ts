import { Controller, Get } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { CitiesByMarketDto } from './dto/cities-by-market.dto';

@Controller('cities')
export class CitiesController {
  constructor(private citiesService: CitiesService) {}

  @Get('cities-by-market')
  async readCitiesByMarket(): Promise<CitiesByMarketDto> {
    const data = await this.citiesService.readCitiesByMarket();

    return { data };
  }
}
