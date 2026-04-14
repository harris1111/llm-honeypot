import { splitResponseChunks } from '@llmtrap/response-engine';
import type { ModelDescriptor, ProtocolService } from '@llmtrap/shared';
import { randomUUID } from 'node:crypto';

import { resolveNodeTextResponse } from '../../response/response-strategy-router';
import { RuntimeStateService } from '../../runtime/runtime-state.service';

export type ChatMessage = {
  content?: string;
  role?: string;
};

export type CompletionResult = {
  chunks: string[];
  completionTokens: number;
  content: string;
  created: number;
  id: string;
  modelName: string;
  promptTokens: number;
  strategy: 'real_model' | 'static' | 'template';
};

export abstract class OpenAiCompatibleService {
  protected abstract readonly serviceName: ProtocolService;

  constructor(protected readonly runtimeStateService: RuntimeStateService) {}

  async buildChatCompletion(
    body: { messages?: ChatMessage[]; model?: string },
    sourceIp?: string,
  ): Promise<CompletionResult> {
    const prompt = (body.messages ?? [])
      .map((message) => message.content?.trim())
      .filter((message): message is string => Boolean(message))
      .join(' ');

    return this.buildCompletion(prompt, body.model, 'chatcmpl', sourceIp);
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

  async buildTextCompletion(
    body: { model?: string; prompt?: string | string[] },
    sourceIp?: string,
  ): Promise<CompletionResult> {
    const prompt = Array.isArray(body.prompt) ? body.prompt.join(' ') : body.prompt ?? '';
    return this.buildCompletion(prompt, body.model, 'cmpl', sourceIp);
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

  protected async buildCompletion(
    prompt: string,
    requestedModel: string | undefined,
    idPrefix: string,
    sourceIp?: string,
  ): Promise<CompletionResult> {
    const routed = await resolveNodeTextResponse({
      prompt,
      requestedModel,
      runtimeStateService: this.runtimeStateService,
      service: this.serviceName,
      sourceIp,
    });

    return {
      chunks: splitResponseChunks(routed.content),
      completionTokens: routed.completionTokens,
      content: routed.content,
      created: Math.floor(Date.now() / 1000),
      id: `${idPrefix}-${randomUUID()}`,
      modelName: routed.modelName,
      promptTokens: routed.promptTokens,
      strategy: routed.strategy,
    };
  }

  protected resolveModel(name?: string): ModelDescriptor {
    const models = this.resolveModels();
    return models.find((model) => model.name === name) ?? models[0];
  }

  protected resolveModels(): ModelDescriptor[] {
    const personaModels = this.runtimeStateService.getPersona()?.models ?? [];

    return personaModels.length > 0
      ? personaModels
      : [{ family: 'llama', name: 'llmtrap-placeholder', parameterSize: '8B', sizeGb: 4 }];
  }
}