export enum AuditLogResource {
  UserPatient = 'user:patient',
  UserSpecialist = 'user:specialist',
  UserStaff = 'user:staff',
  Appointment = 'appointment',
}

export enum AuditLogAction {
  Create = 'create',
  Modify = 'modify',
  Remove = 'remove',
}
