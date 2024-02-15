import { Injectable } from '@nestjs/common';
import { ConfigService } from '../core/services/config.service';
import { ContactNotification } from '../notification/notifications/contact.notification';
import { NotificationService } from '../notification/services/notification.service';
import { PubQueueService } from '../queue/pub-queue.service';
import { ContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly configService: ConfigService,
    private readonly queue: PubQueueService,
    private readonly notifications: NotificationService,
  ) {}

  public async send(dto: ContactDto) {
    await this.notifications.send(ContactNotification, { email: 'hello@getlabs.com' }, dto, {
      email: { from: `"${dto.name}" <${dto.email}>` },
    });
  }
}
