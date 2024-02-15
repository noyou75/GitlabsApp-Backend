import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { LoggerService } from './modules/core/services/logger.service';
import { INestApplicationContext } from '@nestjs/common';

declare const module: __WebpackModuleApi.Module;

// Expose Nest Application container
let app: INestApplicationContext;

async function bootstrap() {
  // app = await NestFactory.create<NestExpressApplication>(AppModule);
  app = await NestFactory.createApplicationContext(AppModule);
  // Use custom logger
  app.useLogger(app.get(LoggerService));

  // Listen for shutdown hooks
  app.enableShutdownHooks();

  // Hot module reload support
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap().catch((err) => console.error(err));
