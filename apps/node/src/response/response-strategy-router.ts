import { routeTemplateResponse } from '@llmtrap/response-engine';
import type { ProtocolService, ResponseConfigRecord } from '@llmtrap/shared';

import type { RuntimeStateService } from '../runtime/runtime-state.service';
import { proxyPromptWithRealModel, type ProxiedTextResponse } from './real-model-proxy';

const budgetUsage = new Map<string, ProxiedTextResponse>();
const budgetReservations = new Map<string, number>();
const fixedNUsage = new Map<string, number>();
const validationKeywords = ['2+2', 'capital of france', 'what model', 'which model', 'who are you', 'uptime', 'version'];

export type ResponseRoutingInput = {
  prompt: string;
  requestedModel?: string;
  runtimeStateService: RuntimeStateService;
  service: ProtocolService;
  sourceIp?: string;
};

export type ResolvedTextResponse = ProxiedTextResponse & {
  strategy: 'real_model' | 'static' | 'template';
  templateId: string | null;
};

export function resetResponseStrategyState(): void {
  budgetUsage.clear();
  budgetReservations.clear();
  fixedNUsage.clear();
}

export async function resolveNodeTextResponse(input: ResponseRoutingInput): Promise<ResolvedTextResponse> {
  const prompt = input.prompt.trim();
  const templateResponse = routeTemplateResponse({
    modelName: input.requestedModel,
    persona: input.runtimeStateService.getPersona(),
    prompt,
    service: input.service,
    templates: input.runtimeStateService.getResponseTemplates(),
  });

  if (!prompt) {
    return buildTemplateResult(templateResponse, prompt);
  }

  const responseConfig = input.runtimeStateService.getResponseConfig();
  if (!canUseProxy(responseConfig)) {
    return buildTemplateResult(templateResponse, prompt);
  }

  const decision = chooseRoutingDecision({
    nodeId: input.runtimeStateService.getNodeId(),
    prompt,
    responseConfig,
    sourceIp: input.sourceIp,
  });

  if (!decision.useProxy) {
    return buildTemplateResult(templateResponse, prompt);
  }

  if (decision.fixedNKey) {
    fixedNUsage.set(decision.fixedNKey, (fixedNUsage.get(decision.fixedNKey) ?? 0) + 1);
  }

  if (decision.budgetKey && decision.budgetReservationUsd) {
    reserveBudgetUsage(decision.budgetKey, decision.budgetReservationUsd);
  }

  try {
    const proxied = await proxyPromptWithRealModel({
      prompt,
      responseConfig,
    });

    if (decision.budgetKey && decision.budgetReservationUsd) {
      releaseBudgetUsage(decision.budgetKey, decision.budgetReservationUsd);
    }

    const budgetKey = buildBudgetKey(input.runtimeStateService.getNodeId());
    if (budgetKey) {
      recordBudgetUsage(budgetKey, proxied);
    }

    return {
      ...proxied,
      strategy: 'real_model',
      templateId: null,
    };
  } catch {
    if (decision.fixedNKey) {
      rollbackFixedNUsage(decision.fixedNKey);
    }

    if (decision.budgetKey && decision.budgetReservationUsd) {
      releaseBudgetUsage(decision.budgetKey, decision.budgetReservationUsd);
    }

    return buildTemplateResult(templateResponse, prompt);
  }
}

function buildTemplateResult(
  templateResponse: { content: string; modelName: string; strategy: 'static' | 'template'; templateId: string | null },
  prompt: string,
): ResolvedTextResponse {
  return {
    completionTokens: estimateTokenCount(templateResponse.content),
    content: templateResponse.content,
    estimatedCost: 0,
    modelName: templateResponse.modelName,
    promptTokens: estimateTokenCount(prompt),
    strategy: templateResponse.strategy,
    templateId: templateResponse.templateId,
  };
}

function canUseProxy(responseConfig: ResponseConfigRecord): boolean {
  return Boolean(responseConfig.proxy.baseUrl.trim() && responseConfig.proxy.model.trim());
}

function chooseRoutingDecision(input: {
  nodeId: string | null;
  prompt: string;
  responseConfig: ResponseConfigRecord;
  sourceIp?: string;
}): { budgetKey?: string; budgetReservationUsd?: number; fixedNKey?: string; useProxy: boolean } {
  for (const strategy of input.responseConfig.strategyChain) {
    if (strategy === 'smart') {
      if (matchesSmartStrategy(input.prompt, input.responseConfig)) {
        return { useProxy: true };
      }
      continue;
    }

    if (strategy === 'fixed_n') {
      const fixedNKey = buildFixedNKey(input.sourceIp, input.responseConfig.fixedN.resetPeriod);
      if (!fixedNKey) {
        continue;
      }

      if ((fixedNUsage.get(fixedNKey) ?? 0) < input.responseConfig.fixedN.n) {
        return { fixedNKey, useProxy: true };
      }

      return { useProxy: false };
    }

    if (strategy === 'budget') {
      const budgetKey = buildBudgetKey(input.nodeId);
      if (!budgetKey) {
        continue;
      }

      const spent = readBudgetUsageUsd(budgetKey);
      if (spent < input.responseConfig.budget.monthlyLimitUsd) {
        return {
          budgetKey,
          budgetReservationUsd: estimateBudgetReservationUsd(input.prompt),
          useProxy: true,
        };
      }

      return { useProxy: false };
    }
  }

  return { useProxy: false };
}

function matchesSmartStrategy(prompt: string, responseConfig: ResponseConfigRecord): boolean {
  const normalizedPrompt = prompt.toLowerCase();
  let confidence = validationKeywords.some((keyword) => normalizedPrompt.includes(keyword)) ? 0.75 : 0;

  if (responseConfig.smart.validationPatterns.some((pattern) => matchesPattern(prompt, pattern))) {
    confidence = 1;
  }

  return confidence >= responseConfig.smart.confidenceThreshold;
}

function matchesPattern(prompt: string, pattern: string): boolean {
  const trimmedPattern = pattern.trim();
  if (!trimmedPattern) {
    return false;
  }

  if (trimmedPattern.startsWith('/') && trimmedPattern.lastIndexOf('/') > 0) {
    const lastSlash = trimmedPattern.lastIndexOf('/');
    const source = trimmedPattern.slice(1, lastSlash);
    const rawFlags = trimmedPattern.slice(lastSlash + 1);
    const flags = rawFlags.includes('i') ? rawFlags : `${rawFlags}i`;

    try {
      return new RegExp(source, flags).test(prompt);
    } catch {
      return false;
    }
  }

  return prompt.toLowerCase().includes(trimmedPattern.toLowerCase());
}

function buildFixedNKey(sourceIp: string | undefined, resetPeriod: 'daily' | 'never' | 'weekly'): string | null {
  if (!sourceIp) {
    return null;
  }

  return `${sourceIp}:${readWindowKey(resetPeriod)}`;
}

function buildBudgetKey(nodeId: string | null): string | null {
  if (!nodeId) {
    return null;
  }

  return `${nodeId}:${new Date().toISOString().slice(0, 7)}`;
}

function readWindowKey(resetPeriod: 'daily' | 'never' | 'weekly'): string {
  if (resetPeriod === 'never') {
    return 'never';
  }

  const now = new Date();
  if (resetPeriod === 'daily') {
    return now.toISOString().slice(0, 10);
  }

  const weeklyAnchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekday = (weeklyAnchor.getUTCDay() + 6) % 7;
  weeklyAnchor.setUTCDate(weeklyAnchor.getUTCDate() - weekday);
  return weeklyAnchor.toISOString().slice(0, 10);
}

function recordBudgetUsage(key: string, usage: ProxiedTextResponse): void {
  const currentUsage = budgetUsage.get(key);
  budgetUsage.set(key, {
    completionTokens: (currentUsage?.completionTokens ?? 0) + usage.completionTokens,
    content: usage.content,
    estimatedCost: Number(((currentUsage?.estimatedCost ?? 0) + usage.estimatedCost).toFixed(6)),
    modelName: usage.modelName,
    promptTokens: (currentUsage?.promptTokens ?? 0) + usage.promptTokens,
  });
}

function reserveBudgetUsage(key: string, amountUsd: number): void {
  budgetReservations.set(key, Number(((budgetReservations.get(key) ?? 0) + amountUsd).toFixed(6)));
}

function releaseBudgetUsage(key: string, amountUsd: number): void {
  const nextValue = Number(((budgetReservations.get(key) ?? 0) - amountUsd).toFixed(6));
  if (nextValue > 0) {
    budgetReservations.set(key, nextValue);
    return;
  }

  budgetReservations.delete(key);
}

function rollbackFixedNUsage(key: string): void {
  const nextValue = (fixedNUsage.get(key) ?? 0) - 1;
  if (nextValue > 0) {
    fixedNUsage.set(key, nextValue);
    return;
  }

  fixedNUsage.delete(key);
}

function readBudgetUsageUsd(key: string): number {
  return Number(((budgetUsage.get(key)?.estimatedCost ?? 0) + (budgetReservations.get(key) ?? 0)).toFixed(6));
}

function estimateBudgetReservationUsd(prompt: string): number {
  return Number(((estimateTokenCount(prompt) / 1000) * 0.002).toFixed(6));
}

function estimateTokenCount(value: string): number {
  return Math.max(1, Math.ceil(value.trim().length / 4));
}