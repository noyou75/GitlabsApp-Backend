import { Controller, Get } from '@nestjs/common';

@Controller('')
export class AppController {

  @Get()
  index() {
    // No specific health checks need to be performed here, just respond with an HTTP 200
    return 'OK';
  }

}
