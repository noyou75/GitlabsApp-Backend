import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { AccessLevel } from '../../common/enums/access-level.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { StaffUser } from '../../entities/user.entity';
import { Command, Optional, Positional } from '../command/command.decorator';
import { StaffUserService } from './staff/staff-user.service';
import { UserService } from './user.service';

@Injectable()
export class CreateUserCommand {
  constructor(private readonly service: UserService) {}

  @Command({ command: 'staff:create <phone>', describe: 'Create a StaffUser user' })
  async createStaffUser(
    @Positional({ name: 'phone' })
    phoneNumber: string,
    @Optional({ name: 'name' })
    name: string,
  ) {
    const staffService = this.service.getService(StaffUser) as StaffUserService;
    await staffService.create(
      plainToClass(
        StaffUser,
        {
          name,
          phoneNumber,
          accessLevel: AccessLevel.Administrator,
        },
        {
          groups: [UserRole.AdminStaff],
        },
      ),
    );
  }
}
