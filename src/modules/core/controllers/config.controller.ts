import { Controller, Get } from '@nestjs/common';
import { ConfigDto } from '../dto/config.dto';
import { ConfigService } from '../services/config.service';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) { }

  @Get()
  public async getConfig(): Promise<ConfigDto> {
    return this.configService.getView(ConfigDto);
  }
}
