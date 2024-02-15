import { Global, HttpModule, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Twilio } from 'twilio';
import { TWILIO_CLIENT } from '../../common/constants';
import { DocumentType } from '../../common/enums/document-type.enum';
import { LogInterceptor } from '../../interceptors/log.interceptor';
import { SentryInterceptor } from '../../interceptors/sentry.interceptor';
import { SerializerInterceptor } from '../../interceptors/serializer.interceptor';
import ormconfig from '../../ormconfig';
import { SharedModule } from '../shared/shared.module';
import { ConfigController } from './controllers/config.controller';
import { BasicConfig, HelloSignConfig, TwilioConfig } from './enums/config.enum';
import { BrowserService } from './services/browser.service';
import { ConfigService } from './services/config.service';
import { FixturesService } from './services/fixtures.service';
import { HelloSignService } from './services/hello-sign.service';
import { HolidayService } from './services/holiday.service';
import { LoggerService } from './services/logger.service';
import { MappingService } from './services/mapping.service';
import { PdfService } from './services/pdf.service';
import { RedisService } from './services/redis.service';
import { SecurityVoterService } from './services/security-voter.service';
import { SentryService } from './services/sentry.service';
import { StorageService } from './services/storage.service';
import { StripeService } from './services/stripe.service';
import { TimezoneService } from './services/timezone.service';

@Global()
@Module({
  imports: [HttpModule.register({ timeout: 15000 }), TypeOrmModule.forRoot(ormconfig), CqrsModule, SharedModule],
  providers: [
    // Services
    ConfigService,
    FixturesService,
    HolidayService,
    LoggerService,
    MappingService,
    RedisService,
    SecurityVoterService,
    StorageService,
    TimezoneService,
    StripeService,
    BrowserService,
    PdfService,
    SentryService,

    // Interceptors
    SentryInterceptor,
    SerializerInterceptor,
    LogInterceptor,

    // Configured Services
    {
      provide: TWILIO_CLIENT,
      useFactory: (configService: ConfigService) => {
        return new Twilio(configService.get(TwilioConfig.ApiKey), configService.get(TwilioConfig.ApiSecret), {
          accountSid: configService.get(TwilioConfig.SID),
        });
      },
      inject: [ConfigService],
    },
    {
      provide: BasicConfig.Secret,
      useFactory: (configService: ConfigService) => {
        return configService.get(BasicConfig.Secret);
      },
      inject: [ConfigService],
    },
    {
      provide: TwilioConfig.AuthMSSID,
      useFactory: (configService: ConfigService) => {
        return configService.get(TwilioConfig.AuthMSSID);
      },
      inject: [ConfigService],
    },
    {
      provide: HelloSignService,
      useFactory: (configService: ConfigService) => {
        return new HelloSignService(configService.get(HelloSignConfig.ApiKey), configService.get(HelloSignConfig.ClientId), {
          [DocumentType.EEA]: configService.get(HelloSignConfig.EEATemplateId),
          [DocumentType.W4]: configService.get(HelloSignConfig.W4TemplateId),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    HttpModule,
    CqrsModule,
    ConfigService,
    FixturesService,
    HolidayService,
    LoggerService,
    MappingService,
    RedisService,
    SecurityVoterService,
    StorageService,
    TimezoneService,
    StripeService,
    BrowserService,
    PdfService,
    TWILIO_CLIENT,
    BasicConfig.Secret,
    TwilioConfig.AuthMSSID,
    HelloSignService,
    SentryService,
  ],

  controllers: [ConfigController]
})
export class CoreModule {}
