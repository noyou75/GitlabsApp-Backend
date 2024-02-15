import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentSampleEntity } from '../../../entities/appointment-sample.entity';
import { CrudController } from '../../api/crud/crud.controller';
import { RolesGuard } from '../../auth/roles.guard';
import { AppointmentSampleService } from './appointment-sample.service';

@Controller('appointment-sample')
@UseGuards(AuthGuard(), RolesGuard)
export class AppointmentSampleController extends CrudController(AppointmentSampleEntity, AppointmentSampleService) {}
