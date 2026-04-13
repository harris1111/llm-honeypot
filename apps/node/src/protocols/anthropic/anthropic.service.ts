import { routeTemplateResponse, splitResponseChunks } from '@llmtrap/response-engine';
import type { ModelDescriptor } from '@llmtrap/shared';
import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import { RuntimeStateService } from '../../runtime/runtime-state.service';

type AnthropicMessage = {
  content?: string | Array<{ text?: string; type?: string }>;
  role?: string;
};

type MessageResult = {
  chunks: string[];
  content: string;
  id: string;
  modelName: string;
  promptTokens: number;
  strategy: 'static' | 'template';
};

@Injectable()
export class AnthropicService {
  constructor(private readonly runtimeStateService: RuntimeStateService) {}

  buildMessageResponse(body: { messages?: AnthropicMessage[]; model?: string }): MessageResult {
    const prompt = (body.messages ?? [])
      .map((message) => this.normalizeMessageContent(message.content))
      .filter((message): message is string => Boolean(message))
      .join(' ');
    const routed = routeTemplateResponse({
      modelName: body.model,
      persona: this.runtimeStateService.getPersona(),
      prompt,
      service: 'anthropic',
    });

    return {
      chunks: splitResponseChunks(routed.content),
      content: routed.content,
      id: `msg_${randomUUID().replaceAll('-', '')}`,
      modelName: routed.modelName,
      promptTokens: Math.max(1, Math.ceil(prompt.length / 4)),
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