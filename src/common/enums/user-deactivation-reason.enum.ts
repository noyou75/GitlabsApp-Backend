export enum PatientDeactivationReason {
  PatientRequested = 'patient-requested',
  DuplicateAccount = 'duplicate-account',
  InappropriateBehavior = 'inappropriate-behavior',
  FrequentCancellations = 'frequent-cancellations',
  FrequentNoShows = 'frequent-no-shows',
  Other = 'other',
}

export enum SpecialistDeactivationReason {
  NoShow = 'no-show',
  SampleDropOffLate = 'sample-drop-off-late',
  PoorPerformance = 'poor-performance',
  Untrustworthy = 'untrustworthy',
  Unprofessional = 'unprofessional',
  PatientComplaints = 'patient-complaints',
  RarelyAvailable = 'rarely-available',
  FrequentCancellations = 'frequent-cancellations',
  Other = 'other',
}

export enum StaffDeactivationReason {
  NoLongerEmployed = 'no-longer-employed',
  RepeatMistakes = 'repeat-mistakes',
  Untrustworthy = 'untrustworthy',
  Unprofessional = 'unprofessional',
  Other = 'other',
}
