import { Injectable } from '@nestjs/common';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { ServiceAreaEntity } from '../../../entities/service-area.entity';
import { Command, Optional, Positional } from '../../command/command.decorator';
import { LoggerService } from '../../core/services/logger.service';
import { NotificationTypeService } from '../../notification/services/notification-type.service';
import { NotificationService } from '../../notification/services/notification.service';
import { PatientUserService } from '../../user/patient/patient-user.service';

@Injectable()
export class PatientBlastNotificationCommand {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationTypeService: NotificationTypeService,
    private readonly patientUserService: PatientUserService,
    private readonly loggerService: LoggerService,
  ) {}

  @Command({
    command: 'marketing:patient-blast-notification',
    describe: 'Send a notification blast to all patients that meet a given criteria',
  })
  public async run(
    @Positional({
      name: 'notification',
      desc: 'Defines the notification to be dispatched to the recipient patients',
    })
    _notification: string,
    @Optional({
      name: 'serviceArea',
      desc:
        'Whether this notification should be sent to users in our service area, users not in our service area, or both. ' +
        'true = users in our service area, false = users not in our service area, undefined = both',
      coerce: (arg: string) => (arg === undefined ? arg : !!arg && /true/i.test(arg)),
    })
    inServiceArea: boolean,
    @Optional({
      name: 'previousAppointments',
      desc:
        'Whether this notification should be sent to users with previouly-booked appointments.  true = users with previous appointments, ' +
        'false = users without previous appointments, undefined = both',
      coerce: (arg: string) => (arg === undefined ? arg : !!arg && /true/i.test(arg)),
    })
    previousAppointments?: boolean,
  ) {
    this.loggerService.info(`Resolving notification type ${_notification}...`);
    const notification = this.notificationTypeService.getType(_notification);

    /* If the supplied notification is not defined, throw an exception */
    if (!notification) {
      throw new Error(`Cannot send blast notification - the supplied notification did not map to a registered Notification class.`);
    }

    /* Retrieve all recipients that match the inbound parameters. */
    const qb = this.patientUserService.getRepository().createQueryBuilder();

    /* If the previousAppointments indicator is set, we will need to modify the query accordingly. */
    if (typeof previousAppointments === 'boolean') {
      this.loggerService.info(
        `Value ${previousAppointments} defined for parameter previousAppointments; ` +
          `resolving users who ${!previousAppointments ? 'do not ' : ''}have previous appointments...`,
      );

      /* Set a left join on appointment so we can filter our results based on whether or not a user has booked a non-cancelled appointment. */
      qb.leftJoin(AppointmentEntity, 'appointment', `appointment.patient_id = ${qb.alias}.id AND appointment.status != :status`)
        .groupBy(`${qb.alias}.id`)
        .having(`COUNT(appointment) ${previousAppointments ? '>' : '='} :limit`)
        .setParameter('limit', 0)
        .setParameter('status', 'cancelled');
    }

    /* If the inServiceArea indicator is set, we will need to modify the query accordingly. */
    if (typeof inServiceArea === 'boolean') {
      this.loggerService.info(
        `Value ${inServiceArea} defined for parameter serviceArea; resolving users who ` +
          `${!inServiceArea ? 'do not ' : ''}reside in Getlabs' service area...`,
      );

      /* Use a subquery to determine whether or not the user's zip code is in the Getlabs service area. */
      qb.where(`${qb.alias}.address_zip_code IS NOT NULL`).andWhere((sqb) => {
        const subQuery = sqb.subQuery().select(`zip_code`).from(ServiceAreaEntity, 'serviceAreaQuery');

        return `${qb.alias}.address_zip_code ${!inServiceArea ? 'NOT' : ''} IN ${subQuery.getQuery()}`;
      });
    }

    const recipients = await qb.getMany();
    this.loggerService.info(`Resolved ${recipients.length} recipients.`);

    /* Dispatch the resolved notification to the indicated recipients */
    this.loggerService.info(`Dispatching notifications to ${recipients.length} recipients...`);
    await Promise.all(recipients.map((recipient) => this.notificationService.send(notification, recipient, { recipient })));
    this.loggerService.info(`Notification dispatch completed successfully.`);
  }
}
