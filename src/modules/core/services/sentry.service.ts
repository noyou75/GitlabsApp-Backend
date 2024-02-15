import { Injectable } from '@nestjs/common';
import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';
import { rootDir } from '../../../root';
import { BasicConfig, SentryConfig } from '../enums/config.enum';
import { ConfigService } from './config.service';

@Injectable()
export class SentryService {
  constructor(private readonly config: ConfigService) {
    Sentry.init({
      dsn: config.get(SentryConfig.DSN),
      debug: !config.isProduction(),
      environment: config.get(BasicConfig.Environment),
      release: config.get(BasicConfig.Version),
      integrations: [
        new RewriteFrames({
          root: rootDir,
        }),
        new Sentry.Integrations.Http({
          breadcrumbs: true,
          tracing: true,
        }),
        new Sentry.Integrations.OnUncaughtException({
          onFatalError: async err => {
            if (err.name === 'SentryError') {
              console.log(err);
            } else {
              Sentry.getCurrentHub().captureException(err);
              process.exit(1);
            }
          },
        }),
        new Sentry.Integrations.OnUnhandledRejection({ mode: 'warn' }),
      ],
    });
  }

  client() {
    return Sentry;
  }
}
