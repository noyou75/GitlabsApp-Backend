import { Injectable } from '@nestjs/common';
import { addHours, format, formatISO, isAfter, isBefore, parseISO } from 'date-fns';
import { Readable } from 'stream';
import { Between } from 'typeorm';
import { LabCompany } from '../../../common/enums/lab-company.enum';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { ReferrerType } from '../../../entities/embed/referral.embed';
import { PatientUser } from '../../../entities/user.entity';
import { AbstractAnalyticsEvent, AnalyticsEventData, BasicAnalyticsEvent } from '../../analytics/abstract-analytics.event';
import { WebEntryAnalyticsEvent } from '../../analytics/events/web-entry-analytics.event';
import { AppointmentBookingFlowEvent } from '../../appointment/appointment-analytics.event';
import { AppointmentService } from '../../appointment/appointment.service';
import { Command, Optional, Positional } from '../../command/command.decorator';
import { GCPConfig } from '../../core/enums/config.enum';
import { ConfigService } from '../../core/services/config.service';
import { LoggerService } from '../../core/services/logger.service';
import { StorageService } from '../../core/services/storage.service';
import { CsvFileService } from '../../reporting/services/csv-file.service';
import { MixpanelQueryService } from '../../analytics/services/mixpanel-query.service';
import { PatientUserService } from '../../user/patient/patient-user.service';
import { AnalyticsEventKeys, BookingFlowAnalyticsEventProcessor } from './booking-flow-analytics-event.processor';
import { ReferrerAppointmentHistoryEventProcessor } from './referrer-appointment-history-event.processor';
import { ReferrerReportFormat } from './referrer-csv-parser.service';
import { ReferrerReportRow, SessionDescription } from './referrer-report.row';

/**
 * Defines mappings for all appointments in which we are interested.
 */
const EventMapping = {
  [AnalyticsEventKeys.WebEntry]: WebEntryAnalyticsEvent,
  [AnalyticsEventKeys.BookFlowStart]: AppointmentBookingFlowEvent,
  [AnalyticsEventKeys.BookFlowProfile]: AppointmentBookingFlowEvent,
  [AnalyticsEventKeys.BookFlowLabProvisioning]: AppointmentBookingFlowEvent,
  [AnalyticsEventKeys.BookFlowPayment]: AppointmentBookingFlowEvent,
  [AnalyticsEventKeys.BookFlowConfirmation]: AppointmentBookingFlowEvent,
  Default: BasicAnalyticsEvent,
};

/**
 * Limit for the amount of iterations we will tolerate when attempting to resolve an active appointment from a rebooking chain.
 */
const REBOOK_RESOLVE_LIMIT = 100;

/**
 * Maps a set of Mixpanel events against a given user session.
 */
export interface SessionEventMapping {
  session: SessionDescription;
  events: AbstractAnalyticsEvent[];
}

/**
 * Defines the functionality of the Referral report.
 */
@Injectable()
export class ReferralReportCommand {
  private readonly analyticsEventProcessor = new BookingFlowAnalyticsEventProcessor();
  private readonly appointmentHistoryProcessor: ReferrerAppointmentHistoryEventProcessor = new ReferrerAppointmentHistoryEventProcessor();

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly patientUserService: PatientUserService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
    private readonly csvFileService: CsvFileService,
    private readonly mixpanelQueryService: MixpanelQueryService,
  ) {}

  @Command({
    command: 'referrers:report:generate',
    describe: 'Generate Referrers Report for the supplied lab company',
  })
  async run(
    @Positional({ name: 'fromDate' })
    _fromDate: string,

    @Positional({ name: 'toDate' })
    _toDate: string,

    @Optional({ name: 'labCompany' })
    labCompany = LabCompany.Labcorp,
  ) {
    const fromDate = parseISO(_fromDate);
    const toDate = parseISO(_toDate);

    this.loggerService.log(
      `Starting referrer report generation for ${labCompany}. ` + `Reporting period start: ${fromDate}; Reporting period end: ${toDate}`,
    );

    /* Step 1 - Retrieve all events from the mixpanel API.  These will be collated into sessions below.  */
    this.loggerService.log('Retrieving all booking workflow mixpanel events in the provided date span');
    const allEvents = await this.mixpanelQueryService.queryEvents(
      {
        from_date: format(fromDate, 'yyyy-MM-dd'),
        to_date: format(toDate, 'yyyy-MM-dd'),
        event: Object.values(AnalyticsEventKeys),
      },
      EventMapping,
      { ascending: false },
    );
    this.loggerService.log(`Found ${allEvents.length} MP booking flow events.`);

    /* Step 2 - Configure the parser and the file output stream */
    this.loggerService.log(`Configuring parser and output file...`);
    const filename = `reports/quarterly/PartnerReferralReport-${labCompany}-${formatISO(new Date())}.csv`;
    const bucket = this.configService.get(GCPConfig.LabcorpPrivateBucket);

    const fileOperator = this.configFileOperator(bucket, filename);
    this.loggerService.log(`Parser and output file configured.  File will be named ${filename}`);

    /* Step 3 - retrieve all known users who have been referred by the supplied lab company.  This is necessary to facilitate association of
     * sessions to users below. */
    this.loggerService.log(`Retrieving all known user profiles referred by ${labCompany}`);
    const knownUsers = (
      await this.patientUserService.query((qb) => {
        qb.where(`partner_referral -> 'data' ->> 'referrer' = '${labCompany}'`);
      })
    ).data;
    this.loggerService.log(`Found ${knownUsers.length} user profiles.`);

    /* Step 4 - Retrieve all of the sessions that were created from referral WebEntry events.  These sessions indicate the *first* session
     * in which a user accessed Getlabs.
     * The events are returned in chronological order, but all of our manipulation of these events will need to be in reverse order
     * to promote optimization.  In that case, we will reverse the array so that we can both iterate negatively and iterate in
     * chronological order. */
    this.loggerService.log('Generating referral sessions and mapping Mixpanel events...');
    const referralSessionMappings = this.getReferralSessionMappings(allEvents, knownUsers, labCompany);
    this.loggerService.log(`Generated ${referralSessionMappings.length} referral session mappings.`);

    /* Step 5 - Process each referral session, and record the resulting report rows into the generated CSV file.  This step encompasses
     * populating each session with its associated mixpanel events, retrieving appointment(s) tied to each session, populating each
     * session with the retrieved appointment(s) details, and outputting the resulting row(s) data into the parser/file output stream. */
    this.loggerService.log('Processing referral sessions; populating each session with Mixpanel and appointment data...');
    const rows = await this.processReferralSessions(referralSessionMappings, fileOperator.inputStream);
    this.loggerService.log(`Processed ${rows} report rows; awaiting completion of CSV file output stream...`);

    /* Step 6 - waiting for the output row processing pipeline to complete. */
    await fileOperator.getComplete$();
    this.loggerService.log(`Report generation procedure complete: CSV file available.  Bucket: ${bucket} - filename: ${filename}`);

    /* Step 7 - and we're done */
  }

  private configFileOperator(bucket: string, filename: string) {
    try {
      return this.csvFileService.getCsvFormatter<ReferrerReportRow>(
        ReferrerReportFormat.ReferrerReportFormatKey,
        this.storageService.write(bucket, filename),
      );
    } catch (err) {
      /* If we run into an exception performing the above, we will need to abandon execution. */
      this.loggerService.error(`Encountered a fatal error - unable to establish file / create the requisite read/write streams: ${err}`);
      throw err;
    }
  }

  private isSameUser(referredSession: SessionEventMapping, sessionEvent: AbstractAnalyticsEvent) {
    /* If the session's indexed ID doesn't match, and the account ID doesn't match, check to see if the known user attached to that session
     * (if available) contains this ID. */
    return (
      sessionEvent.getData().distinct_id === referredSession.session.distinct_id ||
      (referredSession.session.user && this.belongsToUser(sessionEvent, referredSession.session.user))
    );
  }

  /**
   * Performs end-to-end processing for the supplied referral session mappings; includes identifying loggable sessions, populating MP event
   * details, retrieving the applicable appointment(s), applying appointment details, writing the output to a CSV file, and persisting
   * the CSV file in a GCP bucket.
   */
  private async processReferralSessions(referralSessionMappings: SessionEventMapping[], inputStream: Readable): Promise<number> {
    /* We must resolve session event details first before we attempt to resolve appointment data and output each record's report result.
     * This is because some currently-known sessions may be discarded by the session event details resolution process, as those
     * sessions may ultimately be indicative of actions we don't care about. */
    const loggableSessions = await Promise.all(
      referralSessionMappings.map((referralSessionMapping) => this.processReferralSessionAnalytics(referralSessionMapping)),
    ).then((_sessionDescriptions) => _sessionDescriptions.filter(Boolean));

    /* Once all of the loggable sessions have been determined from the initial list of candidates, we will need to resolve their respective
     * appointment details, whenever applicable. */
    return Promise.all(
      loggableSessions.map((session, index) => {
        let end = addHours(session.sessionStart, 72);

        for (let i = index + 1; i < loggableSessions.length; i++) {
          const laterSession = loggableSessions[i];

          /* Break from the loop as soon as the session start time is beyond end */
          if (isAfter(laterSession.sessionStart, end)) {
            break;
          }

          /* If we're dealing with the same user, we will need to update our end bound to the start of this later session.
           * Need to check on the basis of user id... */
          if (laterSession.user && laterSession.user.id === session.user.id) {
            end = laterSession.sessionStart;
          }
        }

        return this.processReferralSession(session, inputStream, end);
        // })).then(result => {
      }),
    ).then((result) => {
      /* Need to push a null to signal that the stream is closed. */
      inputStream.push(null);

      /* Reduce the result to indicate the total processed count */
      return result.reduce((total, sessionCount) => total + sessionCount, 0);
    });
  }

  /**
   * Processes the MP events attached to the supplied referral session mapping.
   */
  private async processReferralSessionAnalytics(referralSessionMapping: SessionEventMapping): Promise<SessionDescription> {
    return this.analyticsEventProcessor.processAll(referralSessionMapping.session, referralSessionMapping.events).then((result) => {
      /* If the processor returns errors, we will need to log those. */
      if (result.errors.length) {
        this.log(`Analytics event processing encountered irritating errors: ${result.errors}`, referralSessionMapping.session, 'warn');
      }

      /* If the session details indicate that this session already had a booked appointment upon its commencement, and the user did not
       * attempt to book another appointment (i.e. the user simply checked the status of their existing appointment), we will not
       * track it. */
      if (
        result.target.lastViewedStep &&
        result.target.lastViewedStep.getName() === AnalyticsEventKeys.BookFlowConfirmation &&
        !result.target.bookingStart
      ) {
        this.log('Session indicates that it is simply a user checking on an existing appointments status', referralSessionMapping.session);
        return null;
      }

      return result.target;
    });
  }

  /**
   * Processes the supplied referral session.  This include retrieving all relevant appointment(s), processing appointment data, and writing
   * the end result session description to a CSV file in the GCP storage bucket.
   */
  /* Intentionally modifies the object in place */
  private async processReferralSession(sessionDescription: SessionDescription, inputStream: Readable, end: Date): Promise<number> {
    /* The retrieval of some steps may be asynchronous; for the sake of optimization, we will allow these all to occur in parallel, then
     * return a promise that resolves when this resolution process is complete. */
    // const sessionPromises: Array<Promise<SessionDescription>> = [];
    this.log(`Populating session appointment details...`, sessionDescription);

    /* If this referralSessionMapping indicates that a user is present, we will attempt to query appointment details through the
     * user's account. We do this because it covers cases where appointments are (in the future...) scheduled by non-user
     * personnel (i.e. team-side appointment creation, these must be tracked as referred appointments as well) */
    if (sessionDescription.user) {
      this.log(`Attempting to backfill appointment data...`, sessionDescription);
      this.log(`Attempting to resolve appointment details between ${sessionDescription.sessionStart}, and ${end}...`, sessionDescription);

      /* Retrieve all original appointment bookings (we need to search for original bookings as rebookings will have date stamps that
       * may fall outside of the range of the referral window... the rebooked appointment counts as referred if the original was
       * made within the referral window. */
      sessionDescription = await this.appointmentService
        .findOriginalAppointments(sessionDescription.user, {
          createdAt: Between(formatISO(sessionDescription.sessionStart), formatISO(end)),
        })
        .then((appts) => {
          this.log(`Found ${appts.data.length} appointments`, sessionDescription);

          appts.data.forEach((appointment) => {
            /* If this appointment has been rebooked, we will need to find the actual end booking... there may be multiple
             * rebookings, thus we will be required to iterate through every known rebooking until we reach a point where
             * there are no further rebookings.  The end rebooking should count against the current session. */
            for (let i = 0; appointment.rebookedTo && i < REBOOK_RESOLVE_LIMIT; i++) {
              appointment = appointment.rebookedTo;
              this.log(`Rebooking encountered - updating ref to rebookedTo.  Iteration count: ${i}`, sessionDescription);
            }

            /* Tracking the concrete data in our sessionDescription in case we need it */
            sessionDescription.appointments.push(appointment);
          });

          /* Resolve with the updated session (modified in place!) */
          return sessionDescription;
        });
    }

    /* Once our appointment data (if any) has been resolved, we are free to begin processing the appointment's history (if applicable) and
     * ultimately write the output report. */
    this.log(`All session details have been resolved.`, sessionDescription);

    /* Split out appointments from the rest of the flow details, which will be common with OutputRow */
    this.log(`Processing appointment data...`, sessionDescription);

    // eslint-disable-next-line prefer-const
    let { appointments, ...outputRow }: { appointments: AppointmentEntity[] } & ReferrerReportRow = sessionDescription;

    const outputRows: ReferrerReportRow[] = await Promise.all(
      appointments.map((appointment, apptIndex) => {
        /* If the index is greater than 0, we will need to add another output row to accommodate this appointment - this appt was
         * created outside the scope of a user session, but should be coherent with this particular referral session. */
        if (apptIndex) {
          outputRow = { distinct_id: appointment.patient.id };
          // reduced.push(outputRow);

          this.log(`Session has multiple appointments.  Processing appointment ${apptIndex}`, sessionDescription);
        }

        /* Backfill the appointment details set in this iteration */
        return this.backfillAppointmentDetails(outputRow, appointment).finally(() =>
          this.log(`Session appointment backfill complete.`, sessionDescription),
        );
      }),
    ).then((results) => {
      return results.length ? results.map((result) => result.target) : [outputRow];
    });

    this.log(`Recording ${outputRows.length} row(s)`, sessionDescription);

    try {
      /* Record the output rows through the supplied input stream */
      outputRows.forEach((or) => {
        inputStream.push(or);
      });
    } catch (err) {
      /* If we run into an exception, we will record the exception as an error in the logs, but permit the app to continue
       * execution. */
      this.log(
        `Could not record records for ${JSON.stringify(outputRows)} as a result of a ` + `stream-based exception: ${err}`,
        sessionDescription,
        'error',
      );
    }

    /* Resolve this promise with the resulting referral session mapping. */
    return outputRows.length;
  }

  /**
   * Backfills appointment details for the supplied appointment on the supplied report row.
   */
  private async backfillAppointmentDetails(reportRow: ReferrerReportRow, appointment: AppointmentEntity) {
    /* Fill out the various outstanding columns with appointment data */
    reportRow.appointmentId = appointment.id;
    reportRow.specialistId = appointment.specialist.id;
    reportRow.bookedAt = appointment.createdAt;

    const addy = appointment.labLocation?.address;
    reportRow.deliveredLocation =
      addy && `${addy.street}${addy.unit ? ` Unit ${addy.unit}` : ``}, ${addy.city}, ${addy.state}, ${addy.zipCode}`;

    /* Comb through the appointment history to determine if we can fill out the remainder of the fields... */
    this.loggerService.debug(`Processing session history for appointmentId ${appointment.id}`);
    return this.appointmentHistoryProcessor.processAll(reportRow, appointment);
  }

  private belongsToUser(event: AbstractAnalyticsEvent<AnalyticsEventData>, user: PatientUser) {
    /* Amalgamate all known IDs for this user from the app DB, if they are known */
    const ids = [
      user.id,
      ...(user.partnerReferral || []).reduce((collector, partnerReferral) => {
        return collector.concat(partnerReferral.analyticsTokens || []);
      }, []),
    ];

    /* Check to see if the event is tracked under an ID that we are certain belongs to the supplied user. */
    return (
      ids.indexOf(event.getData().distinct_id) > -1 ||
      (event.getData().$distinct_id_before_identity && ids.indexOf(event.getData().$distinct_id_before_identity) > -1)
    );
  }

  private isNewSession(event: AbstractAnalyticsEvent<AnalyticsEventData>) {
    return (
      event instanceof WebEntryAnalyticsEvent &&
      event.getData().referrerType !== ReferrerType.Refresh &&
      event.getData().referrerType !== ReferrerType.InterAppTraversal
    );
  }

  private isWithinSessionWindow(event: AbstractAnalyticsEvent<AnalyticsEventData>, sessionStartTime: Date) {
    return isBefore(event.getData().time, addHours(sessionStartTime, 72));
  }

  private getUserForEvent(knownUsers: Array<PatientUser>, event: AbstractAnalyticsEvent) {
    return knownUsers.find((knownUser) => this.belongsToUser(event, knownUser));
  }

  /**
   * Identifies and retrieves the individual sessions upon which our report will be based.  Associates sets of Mixpanel events with
   * each identified session.
   */
  private getReferralSessionMappings(
    eventPool: Array<AbstractAnalyticsEvent<AnalyticsEventData>>,
    knownUsers: Array<PatientUser>,
    labCompany: LabCompany,
  ): Array<SessionEventMapping> {
    const collector: Array<SessionEventMapping> = [];

    /* Organize the retrieved events into objects that will later become rows. */
    for (let i = eventPool.length - 1; i > -1; i--) {
      const event = eventPool[i];

      /* We specifically seek out web entry events as our starting point for sessions. We will consider WebEntryEvents indicating
       * new referrals, and we will also consider WebEntryEvents not indicating new referrals, but using an ID belonging to a referred
       * user within the referral time frame. */
      const trackable: boolean | PatientUser =
        this.isNewSession(event) &&
        ((event.getData().referrerType === ReferrerType.Partner && event.getData().data?.referrer === labCompany) ||
          !!collector.find((sessionEventMapping) => {
            return (
              sessionEventMapping.session.distinct_id === event.getData().distinct_id &&
              this.isWithinSessionWindow(event, sessionEventMapping.session.sessionStart)
            );
          }) ||
          this.getUserForEvent(knownUsers, event));

      if (trackable) {
        /* Build the basis object that will be used to track this session. */
        const referredSession: SessionEventMapping = {
          session: {
            distinct_id: event.getData().distinct_id,
            ipAddress: event.getData().$ip,
            sessionStart: event.getData().time,
            /* If the user is known to us, we will need to take stock of that here. */
            user: trackable instanceof PatientUser ? trackable : this.getUserForEvent(knownUsers, event),
            appointments: [],
          },
          events: [],
        };

        this.log(`Indexing referred session...`, referredSession.session);
        collector.push(referredSession);

        /* Remove the event from the current array to optimize the processing of the subsequent steps. */
        eventPool.splice(i, 1);

        /* Search for all associated events occurring within this session.  We will start from the current position of the
         * session iterator, as events are sorted chronologically. */
        for (let j = i - 1; j > -1; j--) {
          const sessionEvent = eventPool[j];

          /* Check to see if this event belongs to the same user as the session descriptor. */
          if (this.isSameUser(referredSession, sessionEvent)) {
            /* If the event's indicated time is beyond the referral window, or is a web entry event matching the currently-known ID,
             * break out of the loop now. */
            if (!this.isWithinSessionWindow(sessionEvent, referredSession.session.sessionStart) || this.isNewSession(sessionEvent)) {
              this.log('Reached end of referral window.  Progressing to the next referred session...', referredSession.session);
              break;
            }

            /* When we find an event that matches the currently-known referral ID for this session, we will track this event as
             * part of that session. */
            this.loggerService.debug(`Indexing session event: ${JSON.stringify(sessionEvent)}`);
            referredSession.events.push(sessionEvent);

            /* Remove the event from the event pool to speed up subsequent processing. */
            eventPool.splice(j, 1);
          }
        }

        /* At the conclusion of the above loop, we will need to re-point our iteration cursor to reflect the items
         * removed above. As a consequence of the array being pre-sorted by time, we know that all of this session's events
         * existed at indices *LOWER* than the current session iterator index. */
        i = i - referredSession.events.length;
      }
    }

    /* Now that the set is sorted, we will need to filter out all sessions that entail the user just viewing their previously-
     * arranged appointment. */
    return collector;
  }

  /**
   * Abstraction of the indicated logging method that includes debug details of the supplied session description.
   */
  private log(message: string, sessionDescription?: SessionDescription, loggingLevel: 'warn' | 'info' | 'debug' | 'error' = 'debug') {
    this.loggerService[loggingLevel](
      (sessionDescription && `[${sessionDescription.distinct_id} @ ${sessionDescription.sessionStart}] `) + message,
    );
  }
}
