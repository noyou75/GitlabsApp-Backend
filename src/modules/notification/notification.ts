import { Type } from '@nestjs/common';
import Handlebars from 'handlebars';
import { extend } from 'lodash';
import { loadNotificationTemplate } from '../../common/file.utils';
import { GlGlobals } from '../../common/gl-globals';
import { defaultTemplateRuntimeOptions } from '../../common/template.utils';
import { inlineEmailCss } from './utils/inline-email-css.utils';

export interface NotificationParameters {
  [k: string]: any;
}

export interface NotificationEmailParameters {
  subject: string;
  parameters: { [key: string]: any };
}

export interface EmailNotification {
  subject: string;
  content: string;
}

export enum NotificationTypes {
  Email = 'email',
  SMS = 'sms',
  Voice = 'voice',
}

export type SMSNotification = string;

export type VoiceNotification = string;

export interface INotification {
  renderEmail(params?: NotificationParameters): Promise<EmailNotification | undefined>;

  renderSMS(params?: NotificationParameters): Promise<SMSNotification | undefined>;

  renderVoice(params?: NotificationParameters): Promise<VoiceNotification | undefined>;
}

export abstract class AbstractNotification implements INotification {
  protected [NotificationTypes.Email]: Handlebars.TemplateDelegate;
  protected [NotificationTypes.SMS]: Handlebars.TemplateDelegate;
  protected [NotificationTypes.Voice]: Handlebars.TemplateDelegate;

  protected constructor(
    notificationName: string,
    notificationTypes: NotificationTypes[] = [NotificationTypes.Email, NotificationTypes.SMS],
  ) {
    notificationTypes.forEach((notificationType) => {
      this[notificationType] = Handlebars.compile(loadNotificationTemplate(notificationName, notificationType));
    });
  }

  abstract getEmailParams(params?: NotificationParameters): Promise<NotificationEmailParameters>;

  async renderEmail(params?: NotificationParameters): Promise<EmailNotification | undefined> {
    /* If the implementing class does not have an e-mail notification to dispatch, return undefined. */
    if (!this[NotificationTypes.Email]) {
      return undefined;
    }

    /* Retrieve e-mail parameters from the implementing class */
    const emailParams = await this.getEmailParams(params);

    /* Attach the Getlabs phone number to the retrieved parameters set. */
    const contentParams = extend(
      {
        glPhoneNumber: GlGlobals.PHONE,
        subject: emailParams.subject,
      },
      emailParams.parameters,
    );

    /* Return the formatted e-mail notification */
    return {
      subject: emailParams.subject,
      content: inlineEmailCss(this[NotificationTypes.Email](contentParams, defaultTemplateRuntimeOptions)),
    };
  }

  async renderSMS(params?: NotificationParameters): Promise<SMSNotification | undefined> {
    /* If the implementing class does not have an SMS version, return undefined. */
    return this[NotificationTypes.SMS]
      ? this[NotificationTypes.SMS](
          extend(
            {
              glPhoneNumber: GlGlobals.PHONE,
            },
            params,
          ),
          defaultTemplateRuntimeOptions,
        )
      : undefined;
  }

  async renderVoice(params?: NotificationParameters): Promise<VoiceNotification | undefined> {
    /* If the implementing class does not have a voice version, return undefined. */
    return this[NotificationTypes.Voice] ? this[NotificationTypes.Voice](params, defaultTemplateRuntimeOptions) : undefined;
  }
}

/**
 * Describes a notification instance (i.e. groups a notification against the parameters with which
 * the notification will be assembled).
 */
export interface NotificationDescription {
  notification: Type<INotification>;
  params?: NotificationParameters;
}
