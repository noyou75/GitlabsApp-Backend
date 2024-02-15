import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { RecaptchaGuard } from '../recaptcha/recaptcha.guard';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly service: ContactService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(RecaptchaGuard)
  async send(@Body() dto: ContactDto): Promise<void> {
    await this.service.send(dto);
  }
}
