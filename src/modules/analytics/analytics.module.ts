import { DynamicModule, Module } from '@nestjs/common';
import { MIXPANEL_CLIENT } from '../../common/constants';
import { ConfigService } from '../core/services/config.service';
import { SharedModule } from '../shared/shared.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsContext } from './context/analytics.context';
import { EntityAnalyticsManagerProvider } from './providers/analytics-manager.provider';
import { AnalyticsService } from './services/analytics.service';
import { MixpanelService } from './services/mixpanel.service';
import * as mixpanel from 'mixpanel';

/**
 * Mixpanel module must be registered asynchronously, as it generates dynamic providers for instances of
 * IEntityAnalyticsManager.
 */
@Module({
  imports: [SharedModule],
  providers: [
    {
      provide: MIXPANEL_CLIENT,
      useFactory: (configService: ConfigService) => {
        return mixpanel.init(configService.get('MIXPANEL_TOKEN'));
      },
      inject: [ConfigService],
    },
    MixpanelService,
    AnalyticsService,
    AnalyticsContext,
  ],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, AnalyticsContext],
})
export class AnalyticsModule {
  static async registerAsync(): Promise<DynamicModule> {
    const analyticsManagerProviders = await EntityAnalyticsManagerProvider.getAnalyticsManagerProviders();

    return {
      module: AnayticsModuleAsync,
      imports: [AnalyticsModule],
      providers: [...analyticsManagerProviders],
      exports: [...analyticsManagerProviders, AnalyticsModule],
    };
  }
}

export class AnayticsModuleAsync {}
