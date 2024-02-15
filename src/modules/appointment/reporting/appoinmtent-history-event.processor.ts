import { AppointmentEntity } from '../../../entities/appointment.entity';
import { StatusHistoryEmbed } from '../../../entities/embed/status-history.embed';
import { AbstractEventProcessor, ReportableEvent } from '../../reporting/util/event.processor';

/**
 * Describes an appointment history event in a format that is acceptable by the base report processing framework.
 */
export interface AppointmentHistoryEvent extends ReportableEvent {
  historyEvent: StatusHistoryEmbed;
  appointment: AppointmentEntity;
}

/**
 * Base implementation of an appointment history event processor to be used for report processing purposes.
 */
export class AppointmentHistoryEventProcessor<T> extends AbstractEventProcessor<T, AppointmentHistoryEvent> {
  /**
   * Processes the supplied appointment history event; applies processing to the supplied target.
   */
  public process(target: T, appointmentHistoryEvent: AppointmentHistoryEvent);
  public process(target: T, statusHistoryEmbed: StatusHistoryEmbed, appointment?: AppointmentEntity);
  public process(target: T, event: StatusHistoryEmbed | AppointmentHistoryEvent, appointment?: AppointmentEntity): Promise<T> | T {
    /* If the consumer has provided an AppointmentHistoryEvent object immediately, we can invoke the super class without any
     * transformation.  Otherwise, we will need to perform some light translation on the inbound parameters. */
    return event instanceof StatusHistoryEmbed
      ? super.process(target, {
          getName: () => event.status,
          historyEvent: event,
          appointment,
        })
      : super.process(target, event);
  }

  /**
   * Processes the entire appointment history of the supplied appointment (or the supplied set of appointment history events) against
   * the supplied target; applies processing to the supplied target.
   */
  public processAll(target: T, appointmentOrHistoryEvents: AppointmentEntity | AppointmentHistoryEvent[]) {
    return appointmentOrHistoryEvents instanceof AppointmentEntity
      ? super._processAll<StatusHistoryEmbed>(
          target,
          () => appointmentOrHistoryEvents.statusHistory,
          elem => this.process(target, elem, appointmentOrHistoryEvents),
        )
      : super.processAll(target, appointmentOrHistoryEvents);
  }
}
