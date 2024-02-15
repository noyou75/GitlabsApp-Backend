import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import Mail from 'nodemailer/lib/mailer';
import { CallInstance, CallListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/call';
import { MessageInstance, MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';
import { className } from '../../../common/class.utils';
import { numeric } from '../../../common/string.utils';
import { User } from '../../../entities/user.entity';
import { LoggerService } from '../../core/services/logger.service';
import { TemplatingService } from '../../templating/services/templating.service';
import { INotification, NotificationParameters } from '../notification';
import { MailerService } from './mailer.service';
import { TextMessagingService } from './text-messaging.service';
import { VoiceMessagingService } from './voice-messaging.service';

export interface NotificationConfirmation {
  user: Partial<User>;
  email: any | undefined;
  voice: CallInstance | undefined;
  sms: MessageInstance | undefined;
}

interface DispatchOverrides {
  email?: boolean;
  sms?: boolean;
  voice?: boolean;
}

interface TransportOptions {
  email?: Mail.Options;
  sms?: MessageListInstanceCreateOptions;
  voice?: CallListInstanceCreateOptions;
}

@Injectable()
export class NotificationService {
  private notifications = new Map<Type<INotification>, INotification>();

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly templating: TemplatingService,
    private readonly mailer: MailerService,
    private readonly textMessaging: TextMessagingService,
    private readonly voiceMessaging: VoiceMessagingService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Supports dispatching a given notification to one or many users.  In the case of many users, this method will
   * return a promise that resolves to a collection of NotificationConfirmations.  In the case of a single user, this
   * method will return a promise resolving to a single NotificationConfirmation object.
   */
  async send<T extends NotificationParameters = NotificationParameters>(
    type: Type<INotification>,
    user: Partial<User>,
    params?: T,
    transportOptions?: TransportOptions,
    dispatchOverrides?: DispatchOverrides,
  ): Promise<NotificationConfirmation>;
  async send<T extends NotificationParameters = NotificationParameters>(
    type: Type<INotification>,
    users: Partial<User>[],
    params?: T,
    transportOptions?: TransportOptions,
    dispatchOverrides?: DispatchOverrides,
  ): Promise<Array<NotificationConfirmation>>;
  async send<T extends NotificationParameters = NotificationParameters>(
    type: Type<INotification>,
    users: Partial<User> | Partial<User>[],
    params?: T,
    transportOptions?: TransportOptions,
    dispatchOverrides?: DispatchOverrides,
  ): Promise<Array<NotificationConfirmation> | NotificationConfirmation> {
    if (!this.notifications.has(type)) {
      this.logger.info(`Notification '${className(type)}' not in cache, loading it...`);
      try {
        // Assume the notification is a service and try to get it from the container
        this.notifications.set(type, this.moduleRef.get(type, { strict: false }));
      } catch (e) {
        // Instantiate it directly if the notification doesn't exist as a service
        this.logger.info(`Notification '${className(type)}' is not a service, instantiating it directly`);
        this.notifications.set(type, new type());
      }
    }

    dispatchOverrides = {
      email: true,
      sms: true,
      voice: true,
      ...dispatchOverrides,
    };

    const notification = this.notifications.get(type);

    /* If the consumer passed us a single user, we can immediately invoke and return notifications */
    if (!Array.isArray(users)) {
      return await this.dispatchAllNotifications(users, notification, params, transportOptions, dispatchOverrides);
    }

    /* Otherwise, we are dealing with an array of users. */
    const usersSet = users as Array<Partial<User>>;

    /* Dispatch the appropriate notifications for each supplied user. */
    const notifPromiseMaps = new Array<NotificationConfirmation>();
    for (const user of usersSet) {
      notifPromiseMaps.push(await this.dispatchAllNotifications(user, notification, params, transportOptions, dispatchOverrides));
    }

    return notifPromiseMaps;
  }

  /**
   * Dispatches email, sms, and voice messages to the targeted user.
   */
  private async dispatchAllNotifications(
    user: Partial<User>,
    notification: INotification,
    params?: { [k: string]: any },
    options?: TransportOptions,
    dispatchOverrides?: DispatchOverrides,
  ): Promise<NotificationConfirmation> {
    return {
      user,
      email: dispatchOverrides?.email !== false ? await this.dispatchEmailNotification(user, notification, params, options?.email) : null,
      sms: dispatchOverrides?.sms !== false ? await this.dispatchSMSNotification(user, notification, params, options?.sms) : null,
      voice: dispatchOverrides?.voice !== false ? await this.dispatchVoiceNotification(user, notification, params, options?.voice) : null,
    };
  }

  // ---

  private async dispatchEmailNotification(
    user: Partial<User>,
    notification: INotification,
    params?: { [k: string]: any },
    options?: Mail.Options,
  ): Promise<any | undefined> {
    try {
      const email = await notification.renderEmail(params);

      if (email && user.email) {
        return await this.mailer.send(user.email, email.subject, email.content, options);
      }
    } catch (err) {
      this.logger.error(`Unable to send email notification: ${err}`);
    }
  }

  private async dispatchSMSNotification(
    user: Partial<User>,
    notification: INotification,
    params?: { [k: string]: any },
    options?: MessageListInstanceCreateOptions,
  ): Promise<MessageInstance | undefined> {
    try {
      const sms = await notification.renderSMS(params);

      if (sms && user.phoneNumber) {
        return await this.textMessaging.send(numeric(user.phoneNumber), sms, options);
      }
    } catch (err) {
      this.logger.error(`Unable to send sms notification: ${err}`);
    }
  }

  private async dispatchVoiceNotification(
    user: Partial<User>,
    notification: INotification,
    params?: { [k: string]: any },
    options?: CallListInstanceCreateOptions,
  ): Promise<CallInstance | undefined> {
    try {
      const twiml = await notification.renderVoice(params);

      if (twiml && user.phoneNumber) {
        return await this.voiceMessaging.send(numeric(user.phoneNumber), twiml, options);
      }
    } catch (err) {
      this.logger.error(`Unable to send voice notification: ${err}`);
    }
  }
}
