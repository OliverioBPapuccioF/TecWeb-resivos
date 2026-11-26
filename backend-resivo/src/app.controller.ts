import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET /: the API is alive (used by Docker and Render)
  @Get()
  getStatus() {
    return this.appService.getStatus();
  }

  // GET /salud: the API and the database (used by the frontend)
  @Get('salud')
  getSalud() {
    return this.appService.getSalud();
  }
}
