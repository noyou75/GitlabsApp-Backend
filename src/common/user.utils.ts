import { Type } from '@nestjs/common';
import { UserRole } from './enums/user-role.enum';
import { StaffUser, User } from '../entities/user.entity';

export const hasRole = (user: User, role: UserRole): boolean => {
  return user.getRoles().includes(role);
};

export const isAdministrator = (user: User): boolean => {
  return user instanceof StaffUser && hasRole(user, UserRole.AdminStaff);
};

export const isUserType = (types: Type<User>[] | Type<User>, user: User): boolean => {
  types = Array.isArray(types) ? types : [types];
  return types.some(type => user instanceof type);
};
