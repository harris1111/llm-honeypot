import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { parseNodeEnv } from '@llmtrap/shared';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const env = parseNodeEnv(process.env);
  const app = await NestFactory.create(AppModule);

  await app.listen(env.NODE_HTTP_PORT);

  Logger.log(`LLMTrap node scaffold listening on port ${env.NODE_HTTP_PORT}`, 'Bootstrap');
}

void bootstrap();