import { splitResponseChunks } from '@llmtrap/response-engine';
import type { ModelDescriptor } from '@llmtrap/shared';
import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import { resolveNodeTextResponse } from '../../response/response-strategy-router';
import { RuntimeStateService } from '../../runtime/runtime-state.service';

type AnthropicMessage = {
  content?: string | Array<{ text?: string; type?: string }>;
  role?: string;
};

type MessageResult = {
  chunks: string[];
  completionTokens: number;
  content: string;
  id: string;
  modelName: string;
  promptTokens: number;
  strategy: 'real_model' | 'static' | 'template';
};

@Injectable()
export class AnthropicService {
  constructor(private readonly runtimeStateService: RuntimeStateService) {}

  async buildMessageResponse(
    body: { messages?: AnthropicMessage[]; model?: string },
    sourceIp?: string,
  ): Promise<MessageResult> {
    const prompt = (body.messages ?? [])
      .map((message) => this.normalizeMessageContent(message.content))
      .filter((message): message is string => Boolean(message))
      .join(' ');
    const routed = await resolveNodeTextResponse({
      prompt,
      requestedModel: body.model,
      runtimeStateService: this.runtimeStateService,
      service: 'anthropic',
      sourceIp,
    });

    return {
      chunks: splitResponseChunks(routed.content),
      completionTokens: routed.completionTokens,
      content: routed.content,
      id: `msg_${randomUUID().replaceAll('-', '')}`,
      modelName: routed.modelName,
      promptTokens: routed.promptTokens,
      strategy: routed.strategy,
    };
  }

  listModels() {
    return {
      data: this.resolveModels().map((model) => ({
        created_at: new Date().toISOString(),
        display_name: model.name,
        id: model.name,
        type: 'model',
      })),
      has_more: false,
      object: 'list',
    };
  }

  private normalizeMessageContent(content: AnthropicMessage['content']): string {
    if (Array.isArray(content)) {
      return content
        .map((part) => part.text?.trim())
        .filter((part): part is string => Boolean(part))
        .join(' ');
    }

    return content?.trim() ?? '';
  }

  private resolveModels(): ModelDescriptor[] {
    const personaModels = this.runtimeStateService.getPersona()?.models ?? [];

    return personaModels.length > 0
      ? personaModels
      : [{ family: 'claude', name: 'llmtrap-placeholder', parameterSize: '8B', sizeGb: 4 }];
  }
}