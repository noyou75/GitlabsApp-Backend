import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { ReportAggregatorService } from './format/report-aggregator.service';
import { CsvFileService } from './services/csv-file.service';
import { MixpanelQueryService } from '../analytics/services/mixpanel-query.service';

@Module({
  imports: [SharedModule],
  providers: [
    CsvFileService,
    MixpanelQueryService,
    ReportAggregatorService,
  ],
  exports: [CsvFileService, MixpanelQueryService, ReportAggregatorService],
})
export class ReportingModule {}
