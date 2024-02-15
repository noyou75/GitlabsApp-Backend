import { LabCompany } from './enums/lab-company.enum';

export const getLabName = (lab: LabCompany): string => {
  switch (lab) {
    case LabCompany.Labcorp:
      return 'Labcorp';
    case LabCompany.QuestDiagnostics:
      return 'Quest Diagnostics';
    case LabCompany.SonoraQuest:
      return 'Sonora Quest';
    case LabCompany.LabXpress:
      return 'LabXpress';
    default:
      return '';
  }
};
