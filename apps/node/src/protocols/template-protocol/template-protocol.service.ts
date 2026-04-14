import { splitResponseChunks } from '@llmtrap/response-engine';
import type { ProtocolService } from '@llmtrap/shared';
import { randomUUID } from 'node:crypto';

import { resolveNodeTextResponse } from '../../response/response-strategy-router';
import { RuntimeStateService } from '../../runtime/runtime-state.service';

export type TemplateProtocolResult = {
  chunks: string[];
  completionTokens: number;
  content: string;
  created: number;
  id: string;
  modelName: string;
  promptTokens: number;
  strategy: 'real_model' | 'static' | 'template';
};

export abstract class TemplateProtocolService {
  protected abstract readonly serviceName: ProtocolService;

  constructor(protected readonly runtimeStateService: RuntimeStateService) {}

  protected async buildPromptResult(
    prompt: string,
    requestedModel?: string,
    idPrefix = 'resp',
    sourceIp?: string,
  ): Promise<TemplateProtocolResult> {
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

  protected getPrimaryModelName(requestedModel?: string): string {
    if (requestedModel) {
      return requestedModel;
    }

    return this.runtimeStateService.getPersona()?.models[0]?.name ?? 'llmtrap-placeholder';
  }
}