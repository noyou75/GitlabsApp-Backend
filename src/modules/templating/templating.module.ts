import { Module } from '@nestjs/common';
import { FileModule } from '../file/file.module';
import { TemplatingService } from './services/templating.service';
import { LabDropOffFormTemplate } from './templates/lab-drop-off-form.template';

@Module({
  imports: [FileModule],
  providers: [
    TemplatingService,

    // Templates
    LabDropOffFormTemplate,
  ],
  exports: [TemplatingService],
})
export class TemplatingModule {}
