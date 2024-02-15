import { SetMetadata } from '@nestjs/common';

export const GL_NOTIFICATION_METADATA = 'gl-notification-metadata';

/**
 * Notification decorator - sets the annotated class as a getlabs notification that is discoverable.
 */
export const Notification = () => SetMetadata(GL_NOTIFICATION_METADATA, GL_NOTIFICATION_METADATA);
