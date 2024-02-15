export enum UserRole {
  Patient = 'patient',
  PatientRead = 'patient:read',
  PatientWrite = 'patient:write',

  Specialist = 'specialist',
  SpecialistRead = 'specialist:read',
  SpecialistWrite = 'specialist:write',

  Staff = 'staff',
  StaffRead = 'staff:read',
  StaffWrite = 'staff:write',

  SupportStaff = 'staff.support',
  SupportStaffRead = 'staff.support:read',
  SupportStaffWrite = 'staff.support:write',

  AdminStaff = 'staff.admin',
  AdminStaffRead = 'staff.admin:read',
  AdminStaffWrite = 'staff.admin:write',
}
