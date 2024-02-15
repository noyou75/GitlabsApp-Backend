import { format } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { LabCompany } from '../../../../common/enums/lab-company.enum';
import { AppointmentEntity } from '../../../../entities/appointment.entity';
import { ReferralEmbed } from '../../../../entities/embed/referral.embed';
import { LabLocationEntity } from '../../../../entities/lab-location.entity';
import { MarketEntity } from '../../../../entities/market.entity';
import { getPopulator, ReportColumn } from '../../../reporting/format/report-aggregator.service';
import { ReferrerService } from '../../service/referrer.service';

export interface ReferrerDailyAppointmentsAggregateParams {
  lab: LabCompany;
}

export class ReferrerDailyAppointmentsAggregateFormat {

  @ReportColumn<string>({
    header: 'Identifier',
    populator: getPopulator(AppointmentEntity, appointment => appointment.identifier),
  })
  identifier: string;

  @ReportColumn<MarketEntity, string>({
    header: 'Market',
    populator: getPopulator(MarketEntity, market => market),
    export: val => val.name
  })
  market: MarketEntity;

  @ReportColumn<string>({
    header: 'Start Time',
    populator: getPopulator(AppointmentEntity, appointment => format(
      utcToZonedTime(appointment.startAt, appointment.patient.timezone), 'dd MMM yyyy HH:mm'))
  })
  startAt: string;

  @ReportColumn<LabLocationEntity, string>({
    header: 'PSC Address',
    populator: getPopulator(AppointmentEntity, appointment => appointment.labLocation),
    export: val => val?.address?.composed,
  })
  labLocation: LabLocationEntity;

  @ReportColumn<string>({
    header: 'Patient First Name',
    populator: getPopulator(AppointmentEntity, appointment => appointment.patient.firstName),
  })
  patientFirstName: string;

  @ReportColumn<string>({
    header: 'Patient Last Name',
    populator: getPopulator(AppointmentEntity, appointment => appointment.patient.lastName),
  })
  patientLastName: string;

  @ReportColumn<Date, string>({
    header: 'Patient DOB',
    populator: getPopulator(AppointmentEntity, appointment => appointment.patient.dob),
    export: dob => dob && format(dob, 'yyyy-MM-dd')
  })
  patientDob: Date;

  @ReportColumn<ReferralEmbed, string>({
    header: 'Referred',
    populator: getPopulator(AppointmentEntity, {
      dependencies: [ReferrerService],
      factory: (referrerService: ReferrerService) => {
        return (appointment, params: ReferrerDailyAppointmentsAggregateParams) => {
          return appointment.patient.partnerReferral?.find((referral: ReferralEmbed) => {
            return (
              referral?.data?.referrer === params.lab &&
              referrerService.getReferrerService(params.lab).isActive(referral, appointment.startAt)
            );
          });
        }
      }
    }),
    export: val => val ? 'Yes' : 'No',
  })
  referred: string;
}
