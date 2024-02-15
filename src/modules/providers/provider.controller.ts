import { Body, Controller, HttpCode, Inject, Post, UseGuards } from '@nestjs/common';
import { RecaptchaGuard } from '../recaptcha/recaptcha.guard';
import { Provider } from './dto/provider';
import { ProviderService } from './provider.service';

/**
 * Providers endpoint - contains API endpoints used by providers who are interested in working with Getlabs.
 */
@Controller('provider')
export class ProviderController {
  @Inject()
  private providersService: ProviderService;

  /**
   * Invoked by the front end whenever a provider submits their details via the providers form; this endpoint pushes the provider's details
   * into a message queue, and posts the provider's details on a slack channel.
   */
  @Post()
  @HttpCode(201)
  @UseGuards(RecaptchaGuard)
  async addProvider(@Body() dto: Provider): Promise<void> {
    await this.providersService.addProvider(dto);
  }
}
