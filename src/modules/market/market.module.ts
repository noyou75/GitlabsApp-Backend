import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketEntity } from '../../entities/market.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SharedModule } from '../shared/shared.module';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MarketSubscriber } from './market.subscriber';
import { MarketVoter } from './market.voter';

@Module({
  imports: [TypeOrmModule.forFeature([MarketEntity]), SharedModule, AnalyticsModule],
  providers: [MarketService, MarketVoter, MarketSubscriber],
  controllers: [MarketController],
  exports: [MarketService],
})
export class MarketModule {}
