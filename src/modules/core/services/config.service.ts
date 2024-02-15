import { Injectable, Type } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import * as envalid from 'envalid';
import {
  AppointmentConfig,
  BasicConfig,
  BusinessHoursConfig,
  GCPConfig,
  HelloSignConfig,
  IntercomConfig,
  MailConfig,
  MixpanelConfig,
  NotificationConfig,
  PatientBookingHours,
  PatientTimezoneConfig,
  RecaptchaConfig,
  RedisConfig,
  SentryConfig,
  SlackConfig,
  StripeConfig,
  TimekitConfig,
  TwilioConfig,
} from '../enums/config.enum';
import { LoggerService } from './logger.service';

@Injectable()
export class ConfigService {
  private readonly config: envalid.CleanEnv;

  constructor(private readonly logger: LoggerService) {
    this.config = envalid.cleanEnv(
      process.env,
      {
        // Basic
        [BasicConfig.Environment]: envalid.str({
          choices: ['development', 'test', 'production'],
          devDefault: 'development',
        }),
        [BasicConfig.Version]: envalid.str({
          devDefault: '',
        }),
        [BasicConfig.Port]: envalid.num({
          default: 3000,
        }),
        [BasicConfig.Domain]: envalid.str({
          choices: ['getlabs.com', 'staging.getlabs.com', 'staging.getlabs.io', 'getlabs.io'],
          devDefault: 'getlabs.io',
        }),
        [BasicConfig.Secret]: envalid.str(),
        [BasicConfig.AutoMigrations]: envalid.bool({
          default: false,
        }),
        [BasicConfig.QueueWorker]: envalid.bool({
          default: false,
        }),

        // Cache
        [RedisConfig.URL]: envalid.url({
          devDefault: 'redis://cache:6379',
        }),

        // Sentry.io Error Reporting
        [SentryConfig.DSN]: envalid.str({
          devDefault: undefined,
        }),

        // Notifications
        [NotificationConfig.EmailAddress]: envalid.str({
          default: undefined,
        }),
        [NotificationConfig.PhoneNumber]: envalid.str({
          default: undefined,
        }),

        // Twilio
        [TwilioConfig.SID]: envalid.str({
          devDefault: 'AC30dc4f26fd8178a6e1a96e7340e979a0',
        }),
        [TwilioConfig.AuthMSSID]: envalid.str({
          devDefault: 'MGffbf04459a7cd1b1ed14d9a5e79d82cc',
        }),
        [TwilioConfig.ApiKey]: envalid.str(),
        [TwilioConfig.ApiSecret]: envalid.str(),
        [TwilioConfig.SourcePhoneNumber]: envalid.str({
          default: '+14806373755',
          devDefault: '+16473705227',
        }),

        // Mail
        [MailConfig.SMTPTransport]: envalid.str(),

        // Timekit
        [TimekitConfig.ApiKey]: envalid.str(),

        // Stripe
        [StripeConfig.ApiKey]: envalid.str(),
        [StripeConfig.WebhookSecret]: envalid.str(),

        // GCP
        [GCPConfig.ApiKey]: envalid.str(),
        [GCPConfig.PublicBucket]: envalid.str({
          devDefault: 'getlabs-dev-public-bgjkythy',
        }),
        [GCPConfig.PrivateBucket]: envalid.str({
          devDefault: 'getlabs-dev-private-abrgxtee',
        }),
        [GCPConfig.LabcorpPrivateBucket]: envalid.str({
          devDefault: 'getlabs-dev-labcorp-6hwpuczl',
        }),
        [GCPConfig.ProvidersQueueTopic]: envalid.str({
          devDefault: '',
        }),

        // Appointment
        [AppointmentConfig.BasePrice]: envalid.num({
          default: 4900,
        }),
        [AppointmentConfig.TimeslotDuration]: envalid.num({
          default: 3600,
        }),
        [AppointmentConfig.UseV2Availability]: envalid.bool({
          default: true,
        }),

        // HelloSign
        [HelloSignConfig.ApiKey]: envalid.str(),
        [HelloSignConfig.ClientId]: envalid.str({
          devDefault: '07efaf1827ef54e3de9b8811a50ab989',
        }),
        [HelloSignConfig.EEATemplateId]: envalid.str({
          devDefault: '2ac7b2057ee89be66c39c99fc5c967a21cfa2c60',
        }),
        [HelloSignConfig.W4TemplateId]: envalid.str({
          devDefault: '9e9c18fd064625a76cb2acbf53060e94897b7873',
        }),

        // Mixpanel
        [MixpanelConfig.MixpanelToken]: envalid.str({
          devDefault: '25393be22569034fbc2135c7f7915f19',
        }),
        [MixpanelConfig.MixpanelApiSecret]: envalid.str({
          devDefault: '71f49c1924eedb79e71cf039e93cdd5f',
        }),
        [MixpanelConfig.MixpanelEventTimezone]: envalid.str({
          default: 'America/Los_Angeles',
        }),

        // Slack
        [SlackConfig.Token]: envalid.str({
          devDefault: 'xoxb-396278540995-906176419632-rp9E0VGuQ4kQq2qTelboCKgw',
        }),
        [SlackConfig.ProvidersChannel]: envalid.str({
          default: 'providers',
          devDefault: 'providers-dev',
        }),
        [SlackConfig.AppointmentsChannel]: envalid.str({
          default: 'new-appointments',
          devDefault: 'new-appointments-dev',
        }),

        // Intercom
        [IntercomConfig.IntercomIdentitySecret]: envalid.str({
          default: '',
        }),

        // Recaptcha
        [RecaptchaConfig.Secret]: envalid.str({
          devDefault: '6LcUVtIUAAAAAIAzwdVmRFzTzfk0ZCEytJgoqkWG',
        }),
        [RecaptchaConfig.ScoreThreshold]: envalid.num({
          default: 0.3,
        }),

        // Patient timezones
        [PatientTimezoneConfig.DefaultTimezone]: envalid.str({
          default: 'America/Phoenix',
        }),

        // Business hours
        [BusinessHoursConfig.BusinessHoursStart]: envalid.str({
          default: '5:00',
        }),
        [BusinessHoursConfig.BusinessHoursEnd]: envalid.str({
          default: '16:00',
        }),

        // Patient booking hours
        [PatientBookingHours.PatientBookingHoursStart]: envalid.str({
          default: '5:00',
        }),
        [PatientBookingHours.PatientBookingHoursEnd]: envalid.str({
          default: '13:00',
        }),
        [PatientBookingHours.PatientBookingHoursBlackoutWindow]: envalid.num({
          default: 4,
        }),
        [PatientBookingHours.PatientBookingHoursPriorityWindow]: envalid.num({
          default: 3,
        }),
      },
      {
        strict: true,
        dotEnvPath: '.env',
      },
    );

    if (!this.isProduction()) {
      this.logger.info('Loading Environment with:', this.config);
    }
  }

  get(key: string): any {
    return this.config[key];
  }

  getView<T>(viewType: Type<T>): T {
    /* Take the existing config set, and hydrate an instance of the supplied type with only whitelisted properties
     * set on the resulting object. */
    return plainToClass(viewType, this.config, { excludeExtraneousValues: true });
  }

  isProduction(): boolean {
    return this.config.isProduction;
  }
}
