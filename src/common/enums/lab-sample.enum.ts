export enum LabSampleType {
  YellowSPSBloodCulture = 'yellow-sps-blood-culture',
  BloodCultureBottles = 'blood-culture-bottles',
  LightBlueSodiumCitrate = 'light-blue-sodium-citrate',
  SerumTubePlainNoAdditive = 'serum-tube-plain-no-additive',
  RedClotActivator = 'red-clot-activator',
  RedGraySpeckledClotActivatorGel = 'red-gray-speckled-clot-activator-gel',
  GoldClotActivatorGel = 'gold-clot-activator-gel',
  GreenSodiumHeparin = 'green-sodium-heparin',
  GreenGraySpeckledSodiumHeparinGel = 'green-gray-speckled-sodium-heparin-gel',
  GreenLithiumHeparin = 'green-lithium-heparin',
  LightGreenLithiumHeparinGel = 'light-green-lithium-heparin-gel',
  GreenGraySpeckledLithiumHeparinGel = 'green-gray-speckled-lithium-heparin-gel',
  LavenderK2EDTA = 'lavender-k2edta',
  LavenderK3EDTA = 'lavender-k3edta',
  PinkK2EDTA = 'pink-k2edta',
  WhiteK2EDTAGel = 'white-k2edta-gel',
  TanK2EDTALead = 'tan-k2edta-lead',
  YellowSPSHLA = 'yellow-sps-hla',
  GraySodiumFluoridePotassiumOxalate = 'gray-sodium-fluoride-potassium-oxalate',
  RoyalBlueSodiumHeparin = 'royal-blue-sodium-heparin',
  OrangeThrombin = 'orange-thrombin',
  UrineContainer = 'urine-container',
}

export enum LabSampleTemperature {
  Refrigerated = 'refrigerated',
  Ambient = 'ambient',
  Frozen = 'frozen',
}

export enum LabSampleProcessing {
  None = 'none',
  Spin = 'spin',
  SpinAndAliquot = 'spin-and-aliquot',
  ChainOfCustody = 'chain-of-custody',
}
