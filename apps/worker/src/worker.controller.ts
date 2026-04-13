import { Controller, Get } from '@nestjs/common';

import { WorkerService } from './worker.service';

@Controller('internal')
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Get('health')
  getHealth() {
    const status = this.workerService.getStatus();
    return {
      ...status,
      service: 'worker',
      status: status.healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
    };
  }
}