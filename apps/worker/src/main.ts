import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { parseWorkerEnv } from '@llmtrap/shared';

import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const env = parseWorkerEnv(process.env);
  const app = await NestFactory.create(WorkerModule);

  await app.listen(env.WORKER_PORT);
  Logger.log(`LLMTrap worker listening on port ${env.WORKER_PORT}`, 'Bootstrap');
}

void bootstrap();