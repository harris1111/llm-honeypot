import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('internal/health')
  getHealth(): { service: string; status: string; timestamp: string } {
    return {
      service: 'node',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  getOverview(): { message: string; phase: string } {
    return {
      message: 'LLMTrap honeypot node scaffold is online.',
      phase: 'phase-01-monorepo-setup',
    };
  }
}