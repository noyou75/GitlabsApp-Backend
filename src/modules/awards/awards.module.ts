import { Module } from '@nestjs/common';
import { PatientCreditModule } from '../patient-credit/patient-credit.module';
import { ReferrerModule } from '../referrer/referrer.module';
import { PatientUserModule } from '../user/patient/patient-user.module';
import { AwardCampaignController } from './controllers/award-campaign.controller';
import { AwardConditionsService } from './services/award-conditions.service';
import { AwardDescriptorService } from './services/award-descriptor.service';
import { AwardTriggerService } from './services/award-trigger.service';
import { AwardTypeService } from './services/award-type.service';
import { AwardCampaignService } from './services/award-campaign.service';

@Module({
  imports: [
    PatientCreditModule,
    ReferrerModule,
    PatientUserModule,
  ],
  providers: [
    AwardTypeService,
    AwardConditionsService,
    AwardTypeService,
    AwardTriggerService,
    AwardCampaignService,
    AwardDescriptorService,
  ],
  exports: [
    AwardCampaignService,
  ],
  controllers: [
    AwardCampaignController,
  ]
})
export class AwardsModule {

}
