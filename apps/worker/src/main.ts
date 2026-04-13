import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { WorkerRuntimeConfigService } from './config/worker-runtime-config.service';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(WorkerModule);
  const runtimeConfig = app.get(WorkerRuntimeConfigService).snapshot;

  await app.listen(runtimeConfig.port);
  Logger.log(`LLMTrap worker listening on port ${runtimeConfig.port}`, 'Bootstrap');
}

void bootstrap();