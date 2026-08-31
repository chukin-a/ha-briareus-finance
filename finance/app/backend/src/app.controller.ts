import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      version: '0.1.0',
    };
  }

  @Get('readiness')
  readiness() { return { status: 'ready' }; }

  @Get('config')
  config() { return { currency: process.env.CURRENCY ?? 'UAH', timezone: process.env.TZ ?? 'Europe/Kyiv' }; }
}
