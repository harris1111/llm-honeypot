import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { parseApiEnv } from '@llmtrap/shared';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const env = parseApiEnv(process.env);
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  await app.listen(env.API_PORT);

  Logger.log(`LLMTrap API listening on port ${env.API_PORT}`, 'Bootstrap');
}

void bootstrap();