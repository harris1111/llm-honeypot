import { routeTemplateResponse, splitResponseChunks } from '@llmtrap/response-engine';
import type { ModelDescriptor } from '@llmtrap/shared';
import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import { RuntimeStateService } from '../../runtime/runtime-state.service';

type ChatMessage = { content?: string; role?: string };

type CompletionResult = {
  chunks: string[];
  content: string;
  created: number;
  id: string;
  modelName: string;
  promptTokens: number;
  strategy: 'static' | 'template';
};

@Injectable()
export class OpenAiService {
  constructor(private readonly runtimeStateService: RuntimeStateService) {}

  buildChatCompletion(body: { messages?: ChatMessage[]; model?: string }): CompletionResult {
    const prompt = (body.messages ?? [])
      .map((message) => message.content?.trim())
      .filter((message): message is string => Boolean(message))
      .join(' ');

    return this.buildCompletion(prompt, body.model, 'chatcmpl');
  }

  buildEmbeddingResponse(body: { input?: string | string[]; model?: string }) {
    const joinedInput = Array.isArray(body.input) ? body.input.join(' ') : body.input ?? '';
    const modelName = this.resolveModel(body.model).name;
    const embedding = Array.from({ length: 8 }, (_, index) => {
      const charCode = joinedInput.charCodeAt(index) || 0;
      return Number((charCode / 255).toFixed(6));
    });

    return {
      data: [{ embedding, index: 0, object: 'embedding' }],
      model: modelName,
      object: 'list',
      usage: {
        prompt_tokens: Math.max(1, Math.ceil(joinedInput.length / 4)),
        total_tokens: Math.max(1, Math.ceil(joinedInput.length / 4)),
      },
    };
  }

  buildTextCompletion(body: { model?: string; prompt?: string | string[] }): CompletionResult {
    const prompt = Array.isArray(body.prompt) ? body.prompt.join(' ') : body.prompt ?? '';
    return this.buildCompletion(prompt, body.model, 'cmpl');
  }

  listModels() {
    return {
      data: this.resolveModels().map((model) => ({
        created: 1_700_000_000,
        id: model.name,
        object: 'model',
        owned_by: 'llmtrap',
      })),
      object: 'list',
    };
  }

  private buildCompletion(prompt: string, requestedModel: string | undefined, idPrefix: string): CompletionResult {
    const routed = routeTemplateResponse({
      modelName: requestedModel,
      persona: this.runtimeStateService.getPersona(),
      prompt,
      service: 'openai',
    });

    return {
      chunks: splitResponseChunks(routed.content),
      content: routed.content,
      created: Math.floor(Date.now() / 1000),
      id: `${idPrefix}-${randomUUID()}`,
      modelName: routed.modelName,
      promptTokens: Math.max(1, Math.ceil(prompt.length / 4)),
      strategy: routed.strategy,
    };
  }

  private resolveModel(name?: string): ModelDescriptor {
    const models = this.resolveModels();
    return models.find((model) => model.name === name) ?? models[0];
  }

  private resolveModels(): ModelDescriptor[] {
    const personaModels = this.runtimeStateService.getPersona()?.models ?? [];

    return personaModels.length > 0
      ? personaModels
      : [{ family: 'llama', name: 'llmtrap-placeholder', parameterSize: '8B', sizeGb: 4 }];
  }
}