import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { endOfDay, startOfDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { Brackets } from 'typeorm';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { FilePurpose } from '../../common/enums/file-purpose.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { filterQueryByUser } from '../../common/query.utils';
import { REQUEST_CONTEXT_USER, RequestContext } from '../../common/request-context';
import { AppointmentEntity } from '../../entities/appointment.entity';
import { PatientUser, SpecialistUser, User } from '../../entities/user.entity';
import { CrudController } from '../api/crud/crud.controller';
import { QueryOptionsDto } from '../api/crud/query-options.dto';
import { PagedResponseDto } from '../api/pagination/paged-response.dto';
import { PaginationOptionsDto } from '../api/pagination/pagination-options.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SECURITY_ATTR_MODIFY, SECURITY_ATTR_READ } from '../core/security/security-voter.const';
import { ConfigService } from '../core/services/config.service';
import { StripeService } from '../core/services/stripe.service';
import { FileProcessorStatusDto } from '../file-processor/dto/file-processor-status.dto';
import { FileProcessorJobService } from '../file-processor/services/file-processor-job.service';
import { FileService } from '../file/file.service';
import { CancelledAppointmentFeedbackNotification } from '../notification/notifications/cancelled-appointment-feedback.notification';
import { NotificationService } from '../notification/services/notification.service';
import { ConvertToEntity } from '../shared/decorators/convert-to-entity.decorator';
import { PatientUserService } from '../user/patient/patient-user.service';
import { AppointmentService } from './appointment.service';
import { SECURITY_ATTR_CANCEL, SECURITY_ATTR_MODIFY_STATUS, SECURITY_ATTR_RESCHEDULE } from './appointment.voter';
import { AppointmentCancelDto } from './dto/appointment-cancel.dto';
import { AppointmentDeliveredDto } from './dto/appointment-delivered.dto';
import { AppointmentFeedbackDto } from './dto/appointment-feedback.dto';
import { AppointmentFromKeyDto } from './dto/appointment-from-key.dto';
import { AppointmentListDto } from './dto/appointment-list.dto';
import { AppointmentRefundDto } from './dto/appointment-refund.dto';
import { BookingKeyDto } from './dto/booking-key.dto';
import { CouponDto } from './dto/coupon.dto';
import { PaymentAdjustmentDto } from './dto/payment-adjustment.dto';
import { PaymentIntentDto } from './dto/payment-intent.dto';
import { PaymentDto } from './dto/payment.dto';
import { AppointmentSampleService } from './sample/appointment-sample.service';

const BaseController = CrudController(AppointmentEntity, AppointmentService, {
  query: (qb, params: AppointmentListDto) => {
    if (params.range.startDate) {
      const user = RequestContext.get<User>(REQUEST_CONTEXT_USER);

      qb.where(`(${qb.alias}.startAt, ${qb.alias}.startAt) OVERLAPS (:startOfDay, :endOfDay)`, {
        startOfDay: zonedTimeToUtc(startOfDay(params.range.startDate), user.timezone),
        endOfDay: zonedTimeToUtc(endOfDay(params.range.endDate || params.range.startDate), user.timezone),
      });

      qb.orderBy(`${qb.alias}.startAt`, 'ASC');
    }

    if (params.search) {
      qb.leftJoin(`${qb.alias}.patient`, 'patient');
      qb.andWhere(
        new Brackets((qbWhere) => {
          qbWhere
            .where(`identifier ILIKE :search`)
            .orWhere(`patient.firstName ILIKE :search`)
            .orWhere(`patient.lastName ILIKE :search`)
            .orWhere(`patient.email ILIKE :search`)
            .orWhere(`patient.phoneNumber ILIKE :search`);
        }),
      );

      qb.setParameter('search', params.search + '%');
    }

    // Filter by user so users only see their own appointments
    filterQueryByUser(qb, [PatientUser, SpecialistUser], RequestContext.get<User>(REQUEST_CONTEXT_USER));
  },
});

@Controller('appointment')
@UseGuards(AuthGuard(), RolesGuard)
export class AppointmentController extends BaseController {
  @Inject()
  private readonly samples: AppointmentSampleService;

  @Inject()
  private readonly stripe: StripeService;

  @Inject()
  private readonly patients: PatientUserService;

  @Inject()
  private readonly notifications: NotificationService;

  @Inject()
  private readonly files: FileService;

  @Inject()
  private readonly configService: ConfigService;

  @Inject()
  private readonly fileProcessor: FileProcessorJobService;

  create(): Promise<AppointmentEntity> {
    throw new NotImplementedException();
  }

  delete(): Promise<AppointmentEntity> {
    throw new NotImplementedException();
  }

  @Post('payment-intent')
  @HttpCode(201)
  @Roles(UserRole.Patient)
  async createPaymentIntent(@Body() dto: BookingKeyDto): Promise<PaymentAdjustmentDto> {
    const bookingKey = await this.service.readBookingKey(dto.key);
    return this.service.createPaymentIntent(RequestContext.get(REQUEST_CONTEXT_USER), bookingKey.price, dto.useCredits, {
      bookingKey: dto.key,
    });
  }

  @Post('apply-coupon')
  @Roles(UserRole.Patient)
  async applyCoupon(@Body() dto: CouponDto): Promise<PaymentAdjustmentDto> {
    return await this.service.applyCoupon(dto.paymentIntentId, dto.coupon);
  }

  @Post('remove-coupon')
  @Roles(UserRole.Patient)
  async removeCoupon(@Body() dto: PaymentIntentDto): Promise<PaymentAdjustmentDto> {
    return await this.service.removeCoupon(dto.paymentIntentId);
  }

  @Post('continue-on-mobile')
  @HttpCode(201)
  @Roles(UserRole.Patient)
  async continueOnMobile(): Promise<void> {
    await this.service.sendContinueOnMobileLink(RequestContext.get(REQUEST_CONTEXT_USER));
  }

  @Post('from-key')
  @HttpCode(201)
  @Roles(UserRole.Patient)
  async createFromKey(@Body() data: AppointmentFromKeyDto): Promise<AppointmentEntity> {
    // Appointment creation limited to Patient normally, this route is guarded by user role
    return await this.service.createFromKey(data, RequestContext.get(REQUEST_CONTEXT_USER));
  }

  @Get()
  async list(
    @Query() pagination: PaginationOptionsDto,
    @Query() crudOptions: QueryOptionsDto<AppointmentEntity>,
    @Query() params: AppointmentListDto,
  ): Promise<PagedResponseDto<AppointmentEntity>> {
    return await super.list(pagination, crudOptions, params);
  }

  @Get(':id/payment')
  async readPayment(@ConvertToEntity() entity: AppointmentEntity): Promise<PaymentDto> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_READ);

    if (!entity.paymentIntentId) {
      throw new NotFoundException();
    }

    return new PaymentDto(await this.stripe.retrievePaymentIntent(entity.paymentIntentId));
  }

  @Post(':id/rebook')
  @Roles(UserRole.Staff, UserRole.Patient)
  async rebookFromKey(@ConvertToEntity() entity: AppointmentEntity, @Body() data: BookingKeyDto): Promise<AppointmentEntity> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_RESCHEDULE);

    return await this.service.rebookFromKey(entity, data);
  }

  @Post(':id/refund')
  @Roles(UserRole.Staff)
  async createRefund(@ConvertToEntity() entity: AppointmentEntity, @Body() data: AppointmentRefundDto): Promise<PaymentDto> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_MODIFY);

    if (!entity.paymentIntentId) {
      throw new NotFoundException();
    }

    return new PaymentDto(await this.service.refund(entity, data.reason, true));
  }

  @Post(':id/feedback')
  @Roles(UserRole.Patient)
  async createFeedback(@ConvertToEntity() entity: AppointmentEntity, @Body() data: AppointmentFeedbackDto): Promise<AppointmentEntity> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_READ);

    await this.service.validateAppointmentStatus(entity, AppointmentStatus.Cancelled);

    await this.notifications.send(
      CancelledAppointmentFeedbackNotification,
      { email: 'hello@getlabs.com' },
      { appointment: entity, feedback: data.feedback },
    );

    return entity;
  }

  @Patch(':id/pending')
  @Roles(UserRole.Staff)
  async updateStatusToPending(@ConvertToEntity() entity: AppointmentEntity): Promise<AppointmentEntity> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_MODIFY_STATUS);

    await this.service.validateAppointmentStatus(entity, AppointmentStatus.Confirmed);

    return await this.service.update(entity, { status: AppointmentStatus.Pending });
  }

  @Patch(':id/cancel')
  @Roles(UserRole.Patient, UserRole.Staff)
  async updateStatusToCancelled(
    @ConvertToEntity() entity: AppointmentEntity,
    @Body() data: AppointmentCancelDto,
  ): Promise<AppointmentEntity> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_CANCEL);

    await this.service.validateAppointmentStatus(entity, [AppointmentStatus.Pending, AppointmentStatus.Confirmed]);

    return this.service.update(entity, { status: AppointmentStatus.Cancelled, cancelReason: data.reason, cancelNote: data.note });
  }

  @Patch(':id/confirmed')
  async updateStatusToConfirmed(@ConvertToEntity() entity: AppointmentEntity): Promise<AppointmentEntity> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_MODIFY_STATUS);

    await this.service.validateAppointmentStatus(entity, AppointmentStatus.Pending);

    return await this.service.update(entity, { status: AppointmentStatus.Confirmed });
  }

  @Patch(':id/en-route')
  async updateStatusToEnRoute(@ConvertToEntity() entity: AppointmentEntity): Promise<AppointmentEntity> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_MODIFY_STATUS);

    await this.service.validateAppointmentStatus(entity, [AppointmentStatus.Confirmed]);

    return this.service.update(entity, { status: AppointmentStatus.EnRoute });
  }

  @Patch(':id/in-progress')
  async updateStatusToInProgress(@ConvertToEntity() entity: AppointmentEntity): Promise<AppointmentEntity> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_MODIFY_STATUS);

    await this.service.validateAppointmentStatus(entity, [AppointmentStatus.EnRoute]);

    return this.service.update(entity, { status: AppointmentStatus.InProgress });
  }

  @Patch(':id/collected')
  async updateStatusToCollected(@ConvertToEntity() entity: AppointmentEntity): Promise<AppointmentEntity> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_MODIFY_STATUS);

    await this.service.validateAppointmentStatus(entity, [AppointmentStatus.InProgress]);

    return this.service.update(entity, { status: AppointmentStatus.Collected });
  }

  @Patch(':id/completed')
  async updateStatusToCompleted(
    @ConvertToEntity() entity: AppointmentEntity,
    @Body() data: AppointmentDeliveredDto,
  ): Promise<AppointmentEntity> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_MODIFY_STATUS);

    await this.service.validateAppointmentStatus(entity, [AppointmentStatus.Collected, AppointmentStatus.Completed]);

    return this.service.update(entity, {
      status: AppointmentStatus.Completed,
      recipient: data.recipient,
      signature: await this.files.read(data.signature),
    });
  }

  @Get(':id/file/:type')
  @Roles(UserRole.Specialist, UserRole.Staff)
  async fileGenerationStatus(@Param('id') id: string, @Param('type') type: FilePurpose): Promise<FileProcessorStatusDto> {
    switch (type) {
      case FilePurpose.AppointmentDeliveryForm:
        const isGenerating = await this.fileProcessor.isAppointmentDeliveryFormProcessing(id);
        let file = null;
        if (!isGenerating) {
          const appointment = await this.service.getRepository().findOneOrFail(id);
          await this.service.denyAccessUnlessGranted(appointment, SECURITY_ATTR_READ);
          file = appointment.deliveryForm;
        }
        return {
          id: id,
          generating: isGenerating,
          file: file,
        };
    }
    throw new NotFoundException();
  }

  @Patch(':id/file/:type')
  @Roles(UserRole.Staff)
  async fileGenerate(@ConvertToEntity() entity: AppointmentEntity, @Param('type') type: FilePurpose): Promise<FileProcessorStatusDto> {
    await this.service.denyAccessUnlessGranted(entity, SECURITY_ATTR_MODIFY);
    const result = await this.service.generateFile(entity, type);
    if (!result) {
      throw new NotFoundException();
    }
    return result;
  }
}
