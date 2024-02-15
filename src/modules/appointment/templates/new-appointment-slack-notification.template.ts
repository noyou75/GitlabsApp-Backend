import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import Handlebars from 'handlebars';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { loadFile } from '../../../common/file.utils';
import { defaultTemplateRuntimeOptions } from '../../../common/template.utils';
import { AppointmentEntity } from '../../../entities/appointment.entity';
import { BasicConfig } from '../../core/enums/config.enum';
import { ConfigService } from '../../core/services/config.service';
import { StripeService } from '../../core/services/stripe.service';
import { Template } from '../../templating/template';
import { AppointmentService } from '../appointment.service';

@Injectable()
export class NewAppointmentSlackNotificationTemplate implements Template {
  private readonly html: Handlebars.TemplateDelegate;

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {
    this.html = Handlebars.compile(loadFile('views/slack/new-appointment.hbs'));
  }

  async render(params?: {
    appointment: AppointmentEntity,
    isReturningPatient: boolean,
  }): Promise<string> {
    if (!(params.appointment instanceof AppointmentEntity)) {
      throw new TypeError("Template parameter 'appointment' must be an instance of AppointmentEntity");
    }

    /* Find the payment intent from the supplied appointment to retrieve the full amount actually paid. */
    const paymentIntent = await this.stripeService.retrievePaymentIntent(params.appointment.paymentIntentId);

    /* Retrieve the booking key data associated with the appointment to determine whether or not this is a priority slot, as well as
     * whether or not this patient has previous appointments. */
    const bookingData = paymentIntent && await this.appointmentService.readBookingKey(paymentIntent.metadata.bookingKey);

    return this.html({
      ...params,
      transactionDetails: {
        isPrioritySlot: bookingData?.priority,
        amountPaid: paymentIntent.amount,
        isReturningPatient: !!(await this.appointmentService.getRepository().count({
          where: {
            patient: { id: params.appointment.patient.id },
            status: In([AppointmentStatus.Collected, AppointmentStatus.Completed])
          }
        })),
      },
      appointmentUrl: `https://app.${this.configService.get(BasicConfig.Domain)}/team/appointments/${params.appointment.id}`,
    }, defaultTemplateRuntimeOptions);
  }
}
