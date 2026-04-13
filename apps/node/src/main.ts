import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { getNodeRuntimeConfig } from './config/node-runtime-config';
import { AnthropicModule } from './protocols/anthropic/anthropic.module';
import { AutogptModule } from './protocols/autogpt/autogpt.module';
import { LangserveModule } from './protocols/langserve/langserve.module';
import { LlamacppModule } from './protocols/llamacpp/llamacpp.module';
import { LmStudioModule } from './protocols/lm-studio/lm-studio.module';
import { OpenAiModule } from './protocols/openai/openai.module';
import { TextGenerationWebuiModule } from './protocols/text-generation-webui/text-generation-webui.module';
import { VllmModule } from './protocols/vllm/vllm.module';

async function bootstrap(): Promise<void> {
  const runtimeConfig = getNodeRuntimeConfig();
  const app = await NestFactory.create(AppModule);
  const openAiApp = await NestFactory.create(OpenAiModule);
  const anthropicApp = await NestFactory.create(AnthropicModule);
  const textGenerationWebuiApp = await NestFactory.create(TextGenerationWebuiModule);
  const langserveApp = await NestFactory.create(LangserveModule);
  const autogptApp = await NestFactory.create(AutogptModule);
  const lmStudioApp = await NestFactory.create(LmStudioModule);
  const llamaCppApp = await NestFactory.create(LlamacppModule);
  const vllmApp = await NestFactory.create(VllmModule);

  await app.listen(runtimeConfig.listenPort);
  await openAiApp.listen(runtimeConfig.openAiPort);
  await anthropicApp.listen(runtimeConfig.anthropicPort);
  await textGenerationWebuiApp.listen(runtimeConfig.textGenerationWebuiPort);
  await langserveApp.listen(runtimeConfig.langservePort);
  await autogptApp.listen(runtimeConfig.autoGptPort);
  await lmStudioApp.listen(runtimeConfig.lmStudioPort);
  await llamaCppApp.listen(runtimeConfig.llamaCppPort);
  await vllmApp.listen(runtimeConfig.vllmPort);

  Logger.log(`LLMTrap node control plane listening on port ${runtimeConfig.listenPort}`, 'Bootstrap');
  Logger.log(`LLMTrap OpenAI-compatible listener on port ${runtimeConfig.openAiPort}`, 'Bootstrap');
  Logger.log(`LLMTrap Anthropic-compatible listener on port ${runtimeConfig.anthropicPort}`, 'Bootstrap');
  Logger.log(`LLMTrap text-generation-webui listener on port ${runtimeConfig.textGenerationWebuiPort}`, 'Bootstrap');
  Logger.log(`LLMTrap LangServe listener on port ${runtimeConfig.langservePort}`, 'Bootstrap');
  Logger.log(`LLMTrap AutoGPT listener on port ${runtimeConfig.autoGptPort}`, 'Bootstrap');
  Logger.log(`LLMTrap LM Studio-compatible listener on port ${runtimeConfig.lmStudioPort}`, 'Bootstrap');
  Logger.log(`LLMTrap llama.cpp-compatible listener on port ${runtimeConfig.llamaCppPort}`, 'Bootstrap');
  Logger.log(`LLMTrap vLLM-compatible listener on port ${runtimeConfig.vllmPort}`, 'Bootstrap');
}

void bootstrap();