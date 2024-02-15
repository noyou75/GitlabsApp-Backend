import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabLocationEntity } from '../../entities/lab-location.entity';
import { ServiceAreaEntity } from '../../entities/service-area.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SharedModule } from '../shared/shared.module';
import { LabLocationCommand } from './lab-location/lab-location.command';
import { LabLocationController } from './lab-location/lab-location.controller';
import { LabLocationService } from './lab-location/lab-location.service';
import { LabLocationVoter } from './lab-location/lab-location.voter';
import { PlaceController } from './place/place.controller';
import { ServiceAreaCommand } from './service-area/service-area.command';
import { ServiceAreaController } from './service-area/service-area.controller';
import { ServiceAreaService } from './service-area/service-area.service';
import { ServiceAreaSubscriber } from './service-area/service-area.subscriber';
import { ServiceAreaVoter } from './service-area/service-area.voter';
import { MarketModule } from "../market/market.module";
import { LabLocationSubscriber } from "./lab-location/lab-location.subscriber";

@Module({
  imports: [TypeOrmModule.forFeature([ServiceAreaEntity, LabLocationEntity]), SharedModule, AnalyticsModule, MarketModule],
  providers: [
    ServiceAreaService,
    ServiceAreaCommand,
    LabLocationService,
    LabLocationCommand,
    LabLocationSubscriber,
    LabLocationVoter,
    ServiceAreaSubscriber,
    ServiceAreaVoter,
  ],
  controllers: [LabLocationController, PlaceController, ServiceAreaController],
  exports: [ServiceAreaService, LabLocationService],
})
export class LocaleModule {}
