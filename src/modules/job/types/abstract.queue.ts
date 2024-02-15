import { BeforeApplicationShutdown, Inject } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { OnQueueActive, OnQueueCompleted, OnQueueError, OnQueueFailed, OnQueueStalled } from '@nestjs/bull';
import { format } from 'util';
import { LoggerService } from '../../core/services/logger.service';
import { SentryService } from '../../core/services/sentry.service';

/**
 * The parent class from which all queues should derive.  This abstract class implements a series of queue lifecycle-linked logging
 * methods, which generically report the status of executing jobs.  This class also exposes a set of helper methods for logging job
 * specifics on the derived tier.
 */
export abstract class AbstractQueue implements BeforeApplicationShutdown {
  @Inject()
  protected readonly logger: LoggerService;

  @Inject()
  protected readonly sentry: SentryService;

  protected queue: Queue;

  @OnQueueActive()
  onActive(job: Job) {
    if (!this.queue) {
      this.queue = job.queue;
    }
    this.logJobStep(job, 'Queue active - beginning processing for job.');
  }

  @OnQueueError()
  async onError(error: Error) {
    this.logQueueError('Queue encountered error: ' + error);
    this.sentry.client().captureException(error);
    await this.sentry.client().flush(10000);
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logJobStep(job, 'Queue stalled processing for job.');
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logJobStep(job, 'Queue completed processing for job.');
  }

  @OnQueueFailed()
  onFailed(job: Job, error: any) {
    this.logQueueError(format('Queue encountered a failure for job: %s', error), job);
  }

  /**
   * Logs the supplied message for the supplied job as an 'error' msg (via LoggerService.error)
   */
  protected logQueueError(message: string, job?: Job) {
    this.logger.error(this.getMessagePrefix(job) + message);
  }

  /**
   * Logs the supplied message for the supplied job as an 'info' msg (via LoggerService.error)
   */
  protected logJobStep(job: Job, message: string) {
    this.logger.info(this.getMessagePrefix(job) + message);
  }

  /**
   * Logs the supplied message for the supplied job as a 'warning' msg (via LoggerService.error)
   */
  protected logJobWarning(job: Job, message: string) {
    this.logger.warn(this.getMessagePrefix(job) + message);
  }

  /**
   * Retrieves a uniform logger message prefix for the supplied job as it relates to this queue type.
   */
  private getMessagePrefix(job?: Job) {
    return format('[Queue:%s]::[Job:%s:%s]:', this.getQueueName(), job?.name || 'N/A', job?.id || 'N/A');
  }

  /**
   * Make sure active jobs are able to finish before shutting down
   */
  public async beforeApplicationShutdown(signal?: string) {
    const queue = this.queue;
    // The queue reference is set when the first active job runs, if it is not set this worker has not processed anything and can be stopped.
    if (!queue) {
      return;
    }

    const activeCount = await queue.getActiveCount();
    const logPrefix = `[${this.constructor.name}#beforeApplicationShutdown]`;
    this.logger.info(
      `${logPrefix} Shutdown message received (${signal}). Pausing local queue ${queue.name}. Waiting for active jobs to finish.`,
    );
    await queue.pause(true, false);

    if (activeCount !== 0) {
      this.logger.info(`${logPrefix} Last job from queue ${queue.name} complete. Waiting for callbacks.`);
      // Wait an additional few seconds to allow the job complete callbacks to run. This is needed to remove the extra keys stored in redis.
      await new Promise<void>((resolve) => setTimeout(resolve, 3000));
    }

    this.logger.info(`${logPrefix} Closing queue connection.`);
    await queue.close(false);
  }

  /**
   * Retrieves the name of this queue.
   */
  protected abstract getQueueName(): string;
}
