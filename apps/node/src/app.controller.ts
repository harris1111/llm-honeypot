import { Controller, Get } from '@nestjs/common';

import { CaptureSyncService } from './capture/capture-sync.service';
import { RuntimeStateService } from './runtime/runtime-state.service';

@Controller()
export class AppController {
  constructor(
    private readonly captureSyncService: CaptureSyncService,
    private readonly runtimeStateService: RuntimeStateService,
  ) {}

  @Get('internal/health')
  async getHealth() {
    return this.runtimeStateService.getHealth(await this.captureSyncService.size());
  }

  @Get()
  getOverview(): { message: string; service: string; status: string } {
    return {
      message: 'LLMTrap honeypot node is online.',
      service: 'node',
      status: this.runtimeStateService.getStatus(),
    };
  }
}