import { SetMetadata } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { MarketEntity } from '../../../entities/market.entity';

export const MarketFilterableOptionsMetadataKey = 'market-filterable';

interface MarketFilterableOptions<E> {
  query: (qb: SelectQueryBuilder<E>, markets: MarketEntity[]) => void;
}

export const MarketFilterable = <E>(options: MarketFilterableOptions<E>) => SetMetadata(MarketFilterableOptionsMetadataKey, options);
