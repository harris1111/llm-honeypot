import { splitResponseChunks } from '@llmtrap/response-engine';
import type { ModelDescriptor } from '@llmtrap/shared';
import { Injectable } from '@nestjs/common';

import { resolveNodeTextResponse } from '../../response/response-strategy-router';
import { RuntimeStateService } from '../../runtime/runtime-state.service';

type ChatMessage = {
  content?: string;
  role?: string;
};

type CompletionResult = {
  chunks: string[];
  completionTokens: number;
  content: string;
  createdAt: string;
  evalCount: number;
  modelName: string;
  promptEvalCount: number;
  strategy: 'real_model' | 'static' | 'template';
  totalDuration: number;
};

@Injectable()
export class OllamaService {
  constructor(private readonly runtimeStateService: RuntimeStateService) {}

  async buildChatResponse(
    body: { messages?: ChatMessage[]; model?: string },
    sourceIp?: string,
  ): Promise<CompletionResult> {
    const prompt = (body.messages ?? [])
      .map((message) => message.content?.trim())
      .filter((message): message is string => Boolean(message))
      .join(' ');

    return this.buildCompletion(prompt, body.model, sourceIp);
  }

  async buildGenerateResponse(
    body: { model?: string; prompt?: string },
    sourceIp?: string,
  ): Promise<CompletionResult> {
    return this.buildCompletion(body.prompt?.trim() ?? '', body.model, sourceIp);
  }

  getModels() {
    return {
      models: this.resolveModels().map((model) => ({
        details: {
          family: model.family,
          format: 'gguf',
          parameter_size: model.parameterSize,
          parent_model: '',
          quantization_level: 'Q4_K_M',
        },
        digest: `sha256:${model.name.replace(/[^a-z0-9]/gi, '').toLowerCase().padEnd(16, '0')}`,
        model: model.name,
        modified_at: new Date().toISOString(),
        name: model.name,
        size: Math.round(model.sizeGb * 1024 * 1024 * 1024),
      })),
    };
  }

  getProcessList() {
    return {
      models: this.resolveModels().map((model) => ({
        digest: `sha256:${model.name.replace(/[^a-z0-9]/gi, '').toLowerCase().padEnd(16, '0')}`,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        model: model.name,
        name: model.name,
        size: Math.round(model.sizeGb * 1024 * 1024 * 1024),
        size_vram: Math.round(model.sizeGb * 512 * 1024 * 1024),
      })),
    };
  }

  getVersion() {
    return { version: '0.6.0-llmtrap' };
  }

  pullModel(body: { name?: string }) {
    return {
      completed: 1,
      digest: `sha256:${(body.name ?? 'llmtrap-placeholder').replace(/[^a-z0-9]/gi, '').toLowerCase().padEnd(16, '0')}`,
      name: body.name ?? this.resolveModels()[0]?.name ?? 'llmtrap-placeholder',
      status: 'success',
      total: 1,
    };
  }

  showModel(body: { name?: string }) {
    const model = this.resolveModel(body.name);

    return {
      details: {
        family: model.family,
        format: 'gguf',
        parameter_size: model.parameterSize,
      },
      license: 'llmtrap-community',
      modelfile: `FROM ${model.name}`,
      parameters: 'temperature 0.7',
      template: '{{ .Prompt }}',
    };
  }

  private async buildCompletion(prompt: string, requestedModel?: string, sourceIp?: string): Promise<CompletionResult> {
    const routed = await resolveNodeTextResponse({
      prompt,
      requestedModel,
      runtimeStateService: this.runtimeStateService,
      service: 'ollama',
      sourceIp,
    });
    const chunks = splitResponseChunks(routed.content);

    return {
      chunks,
      completionTokens: routed.completionTokens,
      content: routed.content,
      createdAt: new Date().toISOString(),
      evalCount: routed.completionTokens,
      modelName: routed.modelName,
      promptEvalCount: routed.promptTokens,
      strategy: routed.strategy,
      totalDuration: Math.max(150_000_000, chunks.length * 55_000_000),
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