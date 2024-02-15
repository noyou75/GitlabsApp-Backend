export enum BasicConfig {
  Environment = 'NODE_ENV',
  Version = 'VERSION',
  Port = 'PORT',
  Domain = 'DOMAIN',
  Secret = 'SECRET',
  AutoMigrations = 'AUTO_MIGRATIONS',
  QueueWorker = 'QUEUE_WORKER',
}

export enum RedisConfig {
  URL = 'REDIS_URL',
}

export enum SentryConfig {
  DSN = 'SENTRY_DSN',
}

export enum NotificationConfig {
  EmailAddress = 'NOTIFICATION_EMAIL_ADDRESS',
  PhoneNumber = 'NOTIFICATION_PHONE_NUMBER',
}

export enum TimekitConfig {
  ApiKey = 'TIMEKIT_API_KEY',
}

export enum StripeConfig {
  ApiKey = 'STRIPE_API_KEY',
  WebhookSecret = 'STRIPE_WEBHOOK_SECRET',
}

export enum GCPConfig {
  ApiKey = 'GOOGLE_API_KEY',
  PrivateBucket = 'GCP_STORAGE_BUCKET_PRIVATE',
  PublicBucket = 'GCP_STORAGE_BUCKET_PUBLIC',
  LabcorpPrivateBucket = 'GCP_STORAGE_BUCKET_LABCORP_PRIVATE',
  ProvidersQueueTopic = 'GCP_PROVIDERS_QUEUE',
}

export enum TwilioConfig {
  SID = 'TWILIO_SID',
  AuthMSSID = 'TWILIO_AUTH_MSSID',
  ApiKey = 'TWILIO_API_KEY',
  ApiSecret = 'TWILIO_API_SECRET',
  SourcePhoneNumber = 'TWILIO_SOURCE_PHONE_NUMBER',
}

export enum MailConfig {
  SMTPTransport = 'SMTP_TRANSPORT',
}

export enum AppointmentConfig {
  BasePrice = 'APPOINTMENT_BASE_PRICE',
  TimeslotDuration = 'APPOINTMENT_TIMESLOT_DURATION',
  UseV2Availability = 'USE_V2_AVAILABILITY', // TODO: Remove with Timekit integration
}

export enum HelloSignConfig {
  ApiKey = 'HELLOSIGN_API_KEY',
  ClientId = 'HELLOSIGN_CLIENT_ID',
  EEATemplateId = 'HELLOSIGN_EEA_TEMPLATE_ID',
  W4TemplateId = 'HELLOSIGN_W4_TEMPLATE_ID',
}

export enum SlackConfig {
  Token = 'SLACK_TOKEN',
  ProvidersChannel = 'SLACK_PROVIDERS_CHANNEL',
  AppointmentsChannel = 'SLACK_APPOINTMENTS_CHANNEL',
}

export enum RecaptchaConfig {
  Secret = 'RECAPTCHA_SECRET_KEY',
  ScoreThreshold = 'RECAPTCHA_SCORE_THRESHOLD',
}

export enum MixpanelConfig {
  MixpanelToken = 'MIXPANEL_TOKEN',
  MixpanelApiSecret = 'MIXPANEL_API_SECRET',
  MixpanelEventTimezone = 'MIXPANEL_EVENT_TIMEZONE',
}

export enum IntercomConfig {
  IntercomIdentitySecret = 'INTERCOM_IDENTITY_SECRET',
}

export enum PatientTimezoneConfig {
  DefaultTimezone = 'PATIENT_DEFAULT_TIMEZONE',
}

export enum BusinessHoursConfig {
  BusinessHoursStart = 'BUSINESS_HOURS_START',
  BusinessHoursEnd = 'BUSINESS_HOURS_END',
}

export enum PatientBookingHours {
  PatientBookingHoursStart = 'PATIENT_BOOKING_HOURS_START',
  PatientBookingHoursEnd = 'PATIENT_BOOKING_HOURS_END',
  PatientBookingHoursBlackoutWindow = 'PATIENT_BOOKING_BLACKOUT_WINDOW',
  PatientBookingHoursPriorityWindow = 'PATIENT_BOOKING_PRIORITY_WINDOW',
}
