import { Controller, Get } from '@nestjs/common';

@Controller('internal')
export class WorkerController {
  @Get('health')
  getHealth(): { service: string; status: string; timestamp: string } {
    return {
      service: 'worker',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}