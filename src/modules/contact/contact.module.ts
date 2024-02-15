import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { QueueModule } from '../queue/queue.module';
import { RecaptchaModule } from '../recaptcha/recaptcha.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [QueueModule, RecaptchaModule, NotificationModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
