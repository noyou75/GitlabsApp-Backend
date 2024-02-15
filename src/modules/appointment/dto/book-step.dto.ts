/**
 * Holds free-form object data that describes the transition into a given book step.
 */
export interface StepDispositionData {
  ordinal: number;
  [key: string]: any;
}

/**
 * DTO is used to track the current step of the appointment booking flow to which a given user has navigated.
 */
export class BookStepDto {
  step: BookStep;
  stepData: StepDispositionData;
  ordinal: number;
}

/**
 * Describes the various steps of the appointment booking flow.
 */
export enum BookStep {
  LabOrderProvisioningType = 'step-0',
  TimeslotSelection = 'step-1',
  Profile = 'step-2',
  LabOrderEntry = 'step-3',
  Payment = 'step-4',
  Confirmation = 'step-5',
}

/**
 * Provides human-readable labels for each of the steps of the appointment booking flow.
 */
export const BookStepNames = {
  [BookStep.LabOrderProvisioningType]: 'Lab Order Provisioning Type',
  [BookStep.TimeslotSelection]: 'Timeslot Selection',
  [BookStep.Profile]: 'Profile',
  [BookStep.LabOrderEntry]: 'Lab Order Entry',
  [BookStep.Payment]: 'Payment',
  [BookStep.Confirmation]: 'Confirmation',
};
