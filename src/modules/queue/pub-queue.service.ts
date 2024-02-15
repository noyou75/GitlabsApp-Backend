import { PubSub } from '@google-cloud/pubsub';
import { Inject, Injectable } from '@nestjs/common';
import { PUB_QUEUE_CLIENT } from '../../common/constants';
import { REQUEST_CONTEXT_IP_ADDRESS, RequestContext } from '../../common/request-context';

/**
 * Describes the basic definition of a message that will be pushed into a queue.
 */
export interface PubQueueMessage {
  [key: string]: any;
  ip?: string;
  messageDate?: Date;
}

/**
 * Primary interface for interacting with application message queues.
 */
@Injectable()
export class PubQueueService {
  @Inject(PUB_QUEUE_CLIENT)
  private pubsub: PubSub;

  constructor() {}

  /**
   * Publishes the supplied message in the queue for the supplied topic name.
   */
  public async publishMessage(topicName: string, message: PubQueueMessage) {
    /* Retrieve the requested topic */
    let topic = this.pubsub.topic(topicName);

    /* If the topic doesn't exist, create it now. */
    if (!topic) {
      [topic] = await this.pubsub.createTopic(topicName);
    }

    /* If no IP/date is present, add them now. */
    message.ip = message.ip || RequestContext.get(REQUEST_CONTEXT_IP_ADDRESS);
    message.messageDate = message.messageDate || new Date();

    /* Publish the inbound message. */
    await topic.publish(Buffer.from(JSON.stringify(message))).catch(err => {
      /* Throw a new error if we encounter an error on publish. */
      throw new Error(`[PubQueueServie#publishMessage] Error on publishing message: ${err}`);
    });
  }
}
