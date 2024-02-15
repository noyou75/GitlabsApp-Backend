import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import bodyParser from 'body-parser';
import { useContainer as setContainerForClassValidator } from 'class-validator';
import cors from 'cors';
import helmet from 'helmet';
import nocache from 'nocache';
import { RequestContext } from './common/request-context';
import { LogInterceptor } from './interceptors/log.interceptor';
import { SentryInterceptor } from './interceptors/sentry.interceptor';
import { SerializerInterceptor } from './interceptors/serializer.interceptor';
import { AppModule } from './modules/app.module';
import { ConfigService } from './modules/core/services/config.service';
import { LoggerService } from './modules/core/services/logger.service';

declare const module: __WebpackModuleApi.Module;

// Expose Nest Application container
let app: NestExpressApplication;

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    // Enable trace agent in production
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@google-cloud/trace-agent').start({
      ignoreMethods: ['OPTIONS'],
      ignoreUrls: [/^\/$/], // Ignore root health check route
    });
  }

  app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // Disable automatic registration of body-parser middleware due to it causing cls-hooked to lose context
  });

  // Manually register body-parser middleware before request-context middleware
  app.use(
    bodyParser.json({
      limit: '50mb',
      verify(req, res, buf, encoding): void {
        // Limit saving raw body to webhook endpoints because this wastes a lot of memory
        if (req.originalUrl && req.originalUrl.startsWith('/webhook/')) {
          // Save raw body for verification later (eg. during webhooks)
          req.rawBody = buf.toString(encoding || 'utf8');
        }
      },
    }),
  );

  // RequestContext middleware should be registered before all other middleware (except body-parser)
  app.use(RequestContext.middleware);

  // Trust all proxies since this app is never exposed directly to the internet, and we want the
  // client IP to be picked up from X-Forwarded-* headers.
  app.set('trust proxy', true);

  // No caching on API responses
  app.use(nocache());

  // Security stuff
  app.use(helmet());

  app.use(
    cors({
      origin: '*',
    }),
  );

  // Use custom logger
  app.useLogger(app.get(LoggerService));
  app.useGlobalInterceptors(app.get(SentryInterceptor), app.get(LogInterceptor), app.get(SerializerInterceptor));

  // Use Validation on Nest provided route decorators
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      validationError: {
        target: false,
        value: false,
      },
      exceptionFactory: (errors) => new BadRequestException(errors),
    }),
  );

  // Register class-validator container
  setContainerForClassValidator(app.select(AppModule), { fallbackOnErrors: true });

  // // Swagger integration
  // // TODO: Limit to dev env only
  // const builder = new DocumentBuilder()
  //   .setTitle('GetLabs API')
  //   .setDescription('The GetLab API')
  //   .setHost(`api.${app.get(ConfigService).get('DOMAIN')}`)
  //   .setSchemes('https')
  //   .setVersion('1.0'); // TODO: Get this from packager.json
  // const document = SwaggerModule.createDocument(app, builder.build());
  // // // fs.writeFileSync("./swagger-spec.json", JSON.stringify(document));
  // SwaggerModule.setup('/documentation', app, document);
  //

  // Listen for shutdown hooks
  app.enableShutdownHooks();

  // Listen for requests
  await app.listen(app.get(ConfigService).get('PORT') || 3000);

  // Hot module reload support
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap().catch((err) => console.error(err));

// build trigger 1
