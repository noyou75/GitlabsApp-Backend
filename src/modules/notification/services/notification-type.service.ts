import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Inject, Injectable, OnModuleInit, Type } from '@nestjs/common';
import { GL_NOTIFICATION_METADATA } from '../decorator/notification.decorator';
import { INotification } from '../notification';

/**
 * Helper class that can convert a given string into a Notification Type class object.  This is unfortunately necessary, as
 * class objects cannot be stored in databases.
 */
@Injectable()
export class NotificationTypeService implements OnModuleInit {
  private typeMap: { [key: string]: any } = {};

  @Inject()
  private readonly discovery: DiscoveryService;

  onModuleInit(): any {
    /* Discover all classes that are annotated with GlNotification. */
    this.discovery.providersWithMetaAtKey(GL_NOTIFICATION_METADATA).then(notificationClasses => {
      /* Add all discovered types to the type map */
      notificationClasses.forEach(notificationClass => {
        this.typeMap[notificationClass.discoveredClass.name] = notificationClass.discoveredClass.injectType;
      });
    });
  }

  /**
   * Retrieves the notification type class object that corresponds to the supplied key.
   */
  public getType(key: string): Type<INotification> {
    return this.typeMap[key];
  }
}
