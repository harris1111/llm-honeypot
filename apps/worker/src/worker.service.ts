import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';

@Injectable()
export class WorkerService implements OnModuleInit {
  private readonly logger = new Logger(WorkerService.name);

  onModuleInit(): void {
    this.logger.log('Worker bootstrap complete. Queue processors will be added in later phases.');
  }
}