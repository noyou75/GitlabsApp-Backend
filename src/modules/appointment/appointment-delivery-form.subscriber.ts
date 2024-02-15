import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, EntitySubscriberInterface, EventSubscriber, In, UpdateEvent } from 'typeorm';
import { FileProcessorJobService } from '../file-processor/services/file-processor-job.service';
import { TransactionCommitEvent } from 'typeorm/subscriber/event/TransactionCommitEvent';
import { PatientUser } from '../../entities/user.entity';
import { includesColumn, includesRelation } from '../../common/entity.utils';
import { TransactionStartEvent } from 'typeorm/subscriber/event/TransactionStartEvent';
import { AppointmentEntity } from '../../entities/appointment.entity';
import { AppointmentSampleEntity } from '../../entities/appointment-sample.entity';
import { LabOrderDetailsEntity } from '../../entities/lab-order-details.entity';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { LoggerService } from '../core/services/logger.service';

@Injectable()
@EventSubscriber()
export class AppointmentDeliveryFormSubscriber implements EntitySubscriberInterface {
  private appointmentIdsToGenerate: string[];

  private triggers = {
    [PatientUser.name]: {
      columns: [
        'firstName',
        'lastName',
        'guardianName',
        'guardianRelationship',
        'address',
        'phoneNumber',
        'email',
        'gender',
        'address.street',
        'address.city',
        'address.state',
        'address.zipCode',
        'address.unit',
        'dob',
      ],
      relations: ['insurance.front', 'insurance.rear'],
    },
    [AppointmentEntity.name]: {
      columns: ['requiresFasting', 'identifier', 'status'],
      relations: ['labLocation'],
    },
    [AppointmentSampleEntity.name]: { columns: ['type', 'quantity', 'temperature', 'processing'] },
    [LabOrderDetailsEntity.name]: {
      columns: ['contactName', 'contactPhone'],
      relations: ['abnDocument', 'accuDraw', 'labOrderFiles'],
    },
  };

  constructor(
    @InjectConnection() readonly connection: Connection,
    private readonly fileProcessor: FileProcessorJobService,
    private readonly logger: LoggerService,
  ) {
    // Manually register subscriber with connection
    // See: https://github.com/nestjs/typeorm/pull/27#issuecomment-431296683
    connection.subscribers.push(this);
  }

  async afterUpdate(event: UpdateEvent<any>) {
    // Only run if a tracked column or relationship is changed
    if (
      !event.entity ||
      !this.triggers[event.entity.constructor.name] ||
      !(includesColumn(event.updatedColumns, this.triggers[event.entity.constructor.name].columns) || this.hasAnyRelationChanged(event))
    ) {
      return;
    }

    // User changes need all confirmed appointments regenerated
    if (event.entity instanceof PatientUser) {
      await this.processUserEntity(event);
    } else {
      await this.processAppointmentEntities(event);
    }
  }

  beforeTransactionStart(event: TransactionStartEvent) {
    this.appointmentIdsToGenerate = [];
  }

  async afterTransactionCommit(event: TransactionCommitEvent) {
    for (const appointmentId of this.appointmentIdsToGenerate) {
      await this.fileProcessor.generateAppointmentDeliveryForm(appointmentId);
    }
  }

  /**
   * Checks if a tracked relation value has changed
   * Needed because when a relation is null or is a many to many relationship it is always included in the updatedRelations as are to
   */
  private hasAnyRelationChanged(event: UpdateEvent<any>): boolean {
    const relations = this.triggers[event.entity.constructor.name].relations;
    if (!relations || !includesRelation(event.updatedRelations, relations)) {
      return false;
    }
    for (const relation of relations) {
      const relationMetadata = event.metadata.findRelationWithPropertyPath(relation);
      const newRelation = relationMetadata.getEntityValue(event.entity);
      const oldRelation = relationMetadata.getEntityValue(event.databaseEntity);
      if (
        /* If a to many relationship check if the object ids are the same. */
        ((relationMetadata.isManyToMany || relationMetadata.isOneToMany) &&
          newRelation.every((value) => oldRelation.filter((e) => e.id === value.id).length > 0) === false) ||
        /* If a to one relationship check if the object id is the same. */
        ((relationMetadata.isOneToOne || relationMetadata.isManyToOne) && newRelation === null && oldRelation?.id !== null) ||
        (newRelation && newRelation.id !== oldRelation?.id)
      ) {
        return true;
      }
    }
    return false;
  }

  /* If a user is changed generate all PDFs with a status of confirmed */
  private async processUserEntity(event: UpdateEvent<PatientUser>): Promise<void> {
    const user = event.entity;
    const appointments = await event.manager.find(AppointmentEntity, {
      patient: user,
      status: AppointmentStatus.Confirmed,
    });
    await this.addAppointmentsIfReady(appointments, event);
  }

  private async processAppointmentEntities(event: UpdateEvent<any>): Promise<void> {
    const entity = event.entity;
    let appointment: AppointmentEntity;
    switch (entity.constructor.name) {
      case AppointmentEntity.name:
        appointment = entity as AppointmentEntity;
        break;
      case AppointmentSampleEntity.name:
      case LabOrderDetailsEntity.name:
        if (!this.appointmentIdsToGenerate.includes(entity.appointmentId)) {
          appointment = await event.manager.findOne(AppointmentEntity, { id: entity.appointmentId });
        }
        break;
    }
    if (appointment) {
      await this.addAppointmentsIfReady(appointment, event);
    }
  }

  /**
   * Only need to generate forms for appointments with a status of confirmed
   */
  private async addAppointmentsIfReady(appointments: AppointmentEntity | AppointmentEntity[], event: UpdateEvent<any>) {
    appointments = Array.isArray(appointments) ? appointments : [appointments];
    for (const appointment of appointments) {
      if (appointment && !this.appointmentIdsToGenerate.includes(appointment.id) && appointment.status === AppointmentStatus.Confirmed) {
        if (appointment.deliveryForm !== null) {
          appointment.deliveryForm = null;
          await event.manager.save(appointment);
        }
        this.appointmentIdsToGenerate.push(appointment.id);
        this.logger.info(
          `Appointment PDF generation triggered by change in ${event?.entity?.constructor?.name} (id: ${event?.entity?.id}) for appointment id: ${appointment?.id}`,
        );
      }
    }
  }
}
