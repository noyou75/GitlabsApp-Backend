import { AppointmentBookingFlowEvent } from '../../appointment/appointment-analytics.event';
import { IReportFormat, GetFormat, ReportFormat } from '../../reporting/services/csv-file.service';
import { StringEncoderService } from '../../shared/services/string-encoder.service';
import { ReferrerReportRow } from './referrer-report.row';

/**
 * Defines the report format for the referral report.
 */
@ReportFormat(ReferrerReportFormat.ReferrerReportFormatKey)
export class ReferrerReportFormat implements IReportFormat<ReferrerReportRow> {
  public static readonly ReferrerReportFormatKey = 'ReferrerReportFormat';

  @GetFormat()
  getFormat(stringEncoderService: StringEncoderService) {
    return {
      distinct_id: {
        columnTitle: 'Session ID',
        formatter: (value, key, reportRow: ReferrerReportRow) => {
          /* If available, we will prefer the user's account ID.  Otherwise, we'll use the mixpanel ID. */
          const id = reportRow.user?.id || value;

          return id && stringEncoderService.encrypt(id);
        },
      },
      ipAddress: { columnTitle: 'IP Address' },
      sessionStart: { columnTitle: 'Session Start (UTC)' },
      bookingStart: { columnTitle: 'Booking Start (UTC)' },
      lastViewedStep: {
        columnTitle: 'Last Viewed Step',
        formatter: (value: AppointmentBookingFlowEvent | undefined) => {
          if (value) {
            const prefix = typeof value.getData().ordinal === 'number' ? `Step ${value.getData().ordinal + 1}: ` : '';
            return `${prefix}${value.getName().replace(AppointmentBookingFlowEvent.EventNameBase, '')}`;
          }
        },
      },
      appointmentId: {
        columnTitle: 'Appointment ID',
        formatter: (value: string) => value && stringEncoderService.encrypt(value),
      },
      specialistId: {
        columnTitle: 'Specialist ID',
        formatter: (value: string) => value && stringEncoderService.encrypt(value),
      },
      bookedAt: { columnTitle: 'Booked At (UTC)' },
      startAt: { columnTitle: 'Appointment Start Time (UTC)' },
      drawnAt: { columnTitle: 'Draw Time (UTC)' },
      deliveredAt: { columnTitle: 'Delivered Time' },
      deliveredLocation: { columnTitle: 'Delivered Location' },
      drawnDeliveredDuration: { columnTitle: 'Drawn-Delivered Duration (seconds)' },
      cancelledAt: { columnTitle: 'Appointment Cancellation Time (UTC)' },
    };
  }
}
