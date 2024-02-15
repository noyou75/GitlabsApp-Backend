import { AppointmentEntity } from '../../entities/appointment.entity';
import { User } from '../../entities/user.entity';
import { ActorAnalyticsEvent, ActorAnalyticsEventData } from '../analytics/abstract-analytics.event';
import { BookStep, BookStepNames, StepDispositionData } from './dto/book-step.dto';

/**
 * Defines a base analytics event implementation for appointments providing boilerplate functionality.  This functionality
 * includes the selection of the event target user and actor.
 */
export abstract class AbstractAppointmentAnalyticsEvent extends ActorAnalyticsEvent {
  protected constructor(name: string, appointment: AppointmentEntity, data: ActorAnalyticsEventData, actor: User) {
    super(name, data, appointment.patient, actor || appointment.patient);
  }
}

/**
 * Describes the data that is tracked by the AppointmentCreatedAnalyticsEvent.
 */
export interface AppointmentCreatedAnalyticsData extends ActorAnalyticsEventData {
  labOrderSeedType: string;
}

/**
 * Defines an event that describes a creation action of an appointment entity.
 */
export class AppointmentCreatedAnalyticsEvent extends AbstractAppointmentAnalyticsEvent {
  private static readonly EventName = 'AppointmentCreated';

  constructor(appointment: AppointmentEntity, actor?: User) {
    super(
      AppointmentCreatedAnalyticsEvent.EventName,
      appointment,
      {
        labOrderSeedTypes: appointment.labOrderDetails.map(lod => lod.getLabOrderType().type),
      },
      actor,
    );
  }
}

/**
 * Describes the data that is tracked by the AppointmentUpdatedAnalyticsEvent.
 */
export interface AppointmentUpdatedAnalyticsData extends ActorAnalyticsEventData {
  changes: string[];
}

/**
 * Defines an event that describes an update action to an existing appointment entity.
 */
export class AppointmentUpdatedAnalyticsEvent extends AbstractAppointmentAnalyticsEvent {
  private static readonly EventName = 'AppointmentUpdated';

  constructor(appointment: AppointmentEntity, changes: string[], actor?: User) {
    super(
      AppointmentUpdatedAnalyticsEvent.EventName,
      appointment,
      {
        changes,
      },
      actor,
    );
  }
}

/**
 * Describes the data that is tracked by the AppointmentCancelledAnalyticsEvent
 */
export interface AppointmentCancelledAnalyticsData extends ActorAnalyticsEventData {
  cancelReason: string;
}

/**
 * Defines an event that describes an appointment cancellation action.
 */
export class AppointmentCancelledAnalyticsEvent extends AbstractAppointmentAnalyticsEvent {
  private static readonly EventName = 'AppointmentCancelled';

  constructor(appointment: AppointmentEntity, actor?: User) {
    super(
      AppointmentCancelledAnalyticsEvent.EventName,
      appointment,
      {
        cancelReason: appointment.cancelReason.toString(),
      },
      actor,
    );
  }
}

/**
 * Defines an event that describes an appointment rebooking action.
 */
export class AppointmentRebookedAnalyticsEvent extends AbstractAppointmentAnalyticsEvent {
  private static readonly EventName = 'AppointmentRebooked';

  constructor(appointment: AppointmentEntity, actor?: User) {
    super(AppointmentRebookedAnalyticsEvent.EventName, appointment, {}, actor);
  }
}

/**
 * Defines an event that indicates the user has progressed to another step in the booking flow.
 */
export class AppointmentBookingFlowEvent extends ActorAnalyticsEvent {
  public static readonly EventNameBase = 'Booking Flow: ';

  public static getEventName(bookStep: BookStep) {
    return `${AppointmentBookingFlowEvent.EventNameBase}${BookStepNames[bookStep]}`;
  }

  constructor(bookStep: BookStep, patient: User, stepData?: StepDispositionData) {
    super(
      AppointmentBookingFlowEvent.getEventName(bookStep),
      {
        ...stepData,
        step: bookStep,
      },
      patient,
      patient,
    );
  }
}
