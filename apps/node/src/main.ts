import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { getNodeRuntimeConfig } from './config/node-runtime-config';
import { AnthropicModule } from './protocols/anthropic/anthropic.module';
import { OpenAiModule } from './protocols/openai/openai.module';

async function bootstrap(): Promise<void> {
  const runtimeConfig = getNodeRuntimeConfig();
  const app = await NestFactory.create(AppModule);
  const openAiApp = await NestFactory.create(OpenAiModule);
  const anthropicApp = await NestFactory.create(AnthropicModule);

  await app.listen(runtimeConfig.listenPort);
  await openAiApp.listen(runtimeConfig.openAiPort);
  await anthropicApp.listen(runtimeConfig.anthropicPort);

  Logger.log(`LLMTrap node control plane listening on port ${runtimeConfig.listenPort}`, 'Bootstrap');
  Logger.log(`LLMTrap OpenAI-compatible listener on port ${runtimeConfig.openAiPort}`, 'Bootstrap');
  Logger.log(`LLMTrap Anthropic-compatible listener on port ${runtimeConfig.anthropicPort}`, 'Bootstrap');
}

void bootstrap();