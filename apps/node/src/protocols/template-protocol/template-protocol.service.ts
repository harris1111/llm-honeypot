import { routeTemplateResponse, splitResponseChunks } from '@llmtrap/response-engine';
import type { ProtocolService } from '@llmtrap/shared';
import { randomUUID } from 'node:crypto';

import { RuntimeStateService } from '../../runtime/runtime-state.service';

export type TemplateProtocolResult = {
  chunks: string[];
  content: string;
  created: number;
  id: string;
  modelName: string;
  promptTokens: number;
  strategy: 'static' | 'template';
};

export abstract class TemplateProtocolService {
  protected abstract readonly serviceName: ProtocolService;

  constructor(protected readonly runtimeStateService: RuntimeStateService) {}

  protected buildPromptResult(prompt: string, requestedModel?: string, idPrefix = 'resp'): TemplateProtocolResult {
    const routed = routeTemplateResponse({
      modelName: requestedModel,
      persona: this.runtimeStateService.getPersona(),
      prompt,
      service: this.serviceName,
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

  protected getPrimaryModelName(requestedModel?: string): string {
    if (requestedModel) {
      return requestedModel;
    }

    return this.runtimeStateService.getPersona()?.models[0]?.name ?? 'llmtrap-placeholder';
  }
}