import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { CommandModule } from './modules/command/command.module';
import { CommandService } from './modules/command/command.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  app
    .select(CommandModule)
    .get(CommandService)
    .exec();
}

bootstrap().catch(err => console.error(err));
