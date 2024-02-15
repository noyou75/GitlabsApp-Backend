import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { MarketEntity } from '../../entities/market.entity';
import { uniq, sortBy, startCase, toLower } from 'lodash';

export interface CitiesByMarket {
  market: string;
  cities: string[];
}
@Injectable()
export class CitiesService {
  async readCitiesByMarket(): Promise<CitiesByMarket[]> {
    // We hve to use query builder here as 'find' will not filter joined relation: https://stackoverflow.com/questions/59645009/how-to-return-only-some-columns-of-a-relations-with-typeorm
    const markets: Partial<MarketEntity>[] = await getRepository(MarketEntity)
      .createQueryBuilder('m')
      .select(['m.name', 's.city'])
      .where({ isActive: true })
      .leftJoin('m.serviceAreas', 's')
      .getMany();

    return sortBy(
      markets.map((market) => ({
        market: market.name,
        cities: uniq(market.serviceAreas.map((serviceArea) => startCase(toLower(serviceArea.city))).sort()), // All unique cities in the market's service areas converted to title case
      })),
      'market',
    );
  }
}
