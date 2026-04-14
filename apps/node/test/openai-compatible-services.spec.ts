import { defaultResponseConfig } from '@llmtrap/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RuntimeStateService } from '../src/runtime/runtime-state.service';
import { AutogptService } from '../src/protocols/autogpt/autogpt.service';
import { IdeConfigsService } from '../src/protocols/ide-configs/ide-configs.service';
import { LangserveService } from '../src/protocols/langserve/langserve.service';
import { LlamacppService } from '../src/protocols/llamacpp/llamacpp.service';
import { LmStudioService } from '../src/protocols/lm-studio/lm-studio.service';
import { McpService } from '../src/protocols/mcp/mcp.service';
import { OpenAiService } from '../src/protocols/openai/openai.service';
import { TextGenerationWebuiService } from '../src/protocols/text-generation-webui/text-generation-webui.service';
import { VllmService } from '../src/protocols/vllm/vllm.service';
import { resetResponseStrategyState } from '../src/response/response-strategy-router';

function resetRuntimeState(): void {
  const store = (RuntimeStateService as unknown as {
    store: {
      config: Record<string, unknown>;
      lastSyncError: string | null;
      node: unknown;
      persona: unknown;
      requestCount: number;
    };
  }).store;

  store.config = {};
  store.lastSyncError = null;
  store.node = null;
  store.persona = null;
  store.requestCount = 0;
}

const baseNode = {
  id: 'node-1',
  name: 'node-1',
  nodeKeyPrefix: 'llt_node_1',
  status: 'ONLINE',
} as const;

describe('Phase 4 openai-compatible services', () => {
  beforeEach(() => {
    resetRuntimeState();
    resetResponseStrategyState();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes unmatched LM Studio prompts through the lm-studio service label', async () => {
    const service = new LmStudioService(new RuntimeStateService());
    const completion = await service.buildTextCompletion({ prompt: 'zzqv97 unmatched token' });

    expect(completion.content).toContain('lm-studio');
  });

  it('routes unmatched llama.cpp prompts through the llamacpp service label', async () => {
    const service = new LlamacppService(new RuntimeStateService());
    const completion = await service.buildTextCompletion({ prompt: 'zzqv97 unmatched token' });

    expect(completion.content).toContain('llamacpp');
    expect(service.listSlots()).toEqual({
      slots: [
        {
          generation_tokens: 0,
          id: 0,
          model: 'llmtrap-placeholder',
          n_ctx: 8192,
          prompt_tokens: 0,
          state: 'idle',
        },
      ],
    });
  });

  it('routes unmatched vLLM prompts through the vllm service label', async () => {
    const service = new VllmService(new RuntimeStateService());
    const completion = await service.buildTextCompletion({ prompt: 'zzqv97 unmatched token' });

    expect(completion.content).toContain('vllm');
  });

  it('uses approved runtime templates delivered in node config for live routing', async () => {
    const runtimeStateService = new RuntimeStateService();
    runtimeStateService.applyConfig({
      config: {
        responseTemplates: [
          {
            category: 'manual-backfeed',
            id: 'template-approved',
            keywords: ['config', 'vault'],
            responseText: 'Approved runtime template says the vault is mounted on trap-node-01.',
          },
        ],
      },
      node: baseNode,
      persona: null,
      services: { openai: true },
    });

    const service = new OpenAiService(runtimeStateService);
    const completion = await service.buildTextCompletion({ prompt: 'show me your config vault' }, '203.0.113.10');

    expect(completion.strategy).toBe('template');
    expect(completion.content).toContain('Approved runtime template');
  });

  it('routes validation prompts through the configured real model proxy', async () => {
    const runtimeStateService = new RuntimeStateService();
    runtimeStateService.applyConfig({
      config: {
        responseConfig: {
          ...defaultResponseConfig,
          proxy: {
            ...defaultResponseConfig.proxy,
            apiKey: 'sk-test-123',
            baseUrl: 'https://proxy.local/v1',
            maxRetries: 0,
            model: 'gpt-4o-mini',
            timeoutMs: 250,
          },
          smart: {
            ...defaultResponseConfig.smart,
            validationPatterns: ['what model are you'],
          },
          strategyChain: ['smart'],
        },
      },
      node: baseNode,
      persona: null,
      services: { openai: true },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'proxied real-model answer' } }],
          model: 'gpt-4o-mini',
          usage: { completion_tokens: 5, prompt_tokens: 7 },
        }),
        { headers: { 'content-type': 'application/json' }, status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const service = new OpenAiService(runtimeStateService);
    const completion = await service.buildChatCompletion(
      { messages: [{ content: 'What model are you running?' }] },
      '203.0.113.10',
    );

    expect(completion.strategy).toBe('real_model');
    expect(completion.content).toBe('proxied real-model answer');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses the operator-configured proxy model even when the caller requests a different model', async () => {
    const runtimeStateService = new RuntimeStateService();
    runtimeStateService.applyConfig({
      config: {
        responseConfig: {
          ...defaultResponseConfig,
          proxy: {
            ...defaultResponseConfig.proxy,
            apiKey: 'sk-test-123',
            baseUrl: 'https://proxy.local/v1',
            maxRetries: 0,
            model: 'gpt-4o-mini',
            timeoutMs: 250,
          },
          smart: {
            ...defaultResponseConfig.smart,
            validationPatterns: ['what model are you'],
          },
          strategyChain: ['smart'],
        },
      },
      node: baseNode,
      persona: null,
      services: { openai: true },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'proxied configured-model answer' } }],
          model: 'gpt-4o-mini',
          usage: { completion_tokens: 5, prompt_tokens: 7 },
        }),
        { headers: { 'content-type': 'application/json' }, status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const service = new OpenAiService(runtimeStateService);
    await service.buildChatCompletion(
      { messages: [{ content: 'What model are you running?' }], model: 'gpt-4.1-expensive' },
      '203.0.113.10',
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as { body?: string } | undefined;
    expect(requestInit?.body).toBeDefined();
    expect(JSON.parse(requestInit?.body ?? '{}')).toMatchObject({ model: 'gpt-4o-mini' });
  });

  it('limits fixed-N proxy routing per source IP before falling back to templates', async () => {
    const runtimeStateService = new RuntimeStateService();
    runtimeStateService.applyConfig({
      config: {
        responseConfig: {
          ...defaultResponseConfig,
          fixedN: { n: 1, resetPeriod: 'never' },
          proxy: {
            ...defaultResponseConfig.proxy,
            apiKey: 'sk-test-123',
            baseUrl: 'https://proxy.local/v1',
            maxRetries: 0,
            model: 'gpt-4o-mini',
            timeoutMs: 250,
          },
          strategyChain: ['fixed_n'],
        },
      },
      node: baseNode,
      persona: null,
      services: { openai: true },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'first proxied answer' } }],
          model: 'gpt-4o-mini',
          usage: { completion_tokens: 4, prompt_tokens: 6 },
        }),
        { headers: { 'content-type': 'application/json' }, status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const service = new OpenAiService(runtimeStateService);
    const firstResponse = await service.buildTextCompletion({ prompt: 'Summarize the service' }, '203.0.113.24');
    const secondResponse = await service.buildTextCompletion({ prompt: 'Summarize the service' }, '203.0.113.24');

    expect(firstResponse.strategy).toBe('real_model');
    expect(secondResponse.strategy).not.toBe('real_model');
    expect(secondResponse.content).toContain('openai');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('routes unmatched text-generation-webui prompts through the text-generation-webui service label', () => {
    const service = new TextGenerationWebuiService(new RuntimeStateService());
    const response = service.buildGenerateResponse({ prompt: 'zzqv97 unmatched token' });

    return expect(response).resolves.toMatchObject({ content: expect.stringContaining('text-generation-webui') });
  });

  it('routes unmatched LangServe prompts through the langserve service label', async () => {
    const service = new LangserveService(new RuntimeStateService());
    const response = await service.buildInvokeResponse({ input: { question: 'zzqv97 unmatched token' } });

    expect(response.content).toContain('langserve');
  });

  it('routes text-generation-webui validation prompts through the configured real model proxy', async () => {
    const runtimeStateService = new RuntimeStateService();
    runtimeStateService.applyConfig({
      config: {
        responseConfig: {
          ...defaultResponseConfig,
          proxy: {
            ...defaultResponseConfig.proxy,
            apiKey: 'sk-test-123',
            baseUrl: 'https://proxy.local/v1',
            maxRetries: 0,
            model: 'gpt-4o-mini',
            timeoutMs: 250,
          },
          smart: {
            ...defaultResponseConfig.smart,
            validationPatterns: ['what model are you'],
          },
          strategyChain: ['smart'],
        },
      },
      node: baseNode,
      persona: null,
      services: { 'text-generation-webui': true },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'proxied text-generation-webui answer' } }],
          model: 'gpt-4o-mini',
          usage: { completion_tokens: 5, prompt_tokens: 7 },
        }),
        { headers: { 'content-type': 'application/json' }, status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const service = new TextGenerationWebuiService(runtimeStateService);
    const response = await service.buildGenerateResponse({ prompt: 'what model are you running?' }, '203.0.113.88');

    expect(response.strategy).toBe('real_model');
    expect(response.content).toBe('proxied text-generation-webui answer');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('tracks AutoGPT runs in memory and returns the latest status snapshot', () => {
    const service = new AutogptService(new RuntimeStateService());
    const started = service.startAgent({ goal: 'Inventory repos', task: 'Scan MCP configs' });
    const status = service.getStatus(started.agent_id);

    expect(started.status).toBe('running');
    expect(status.agent_id).toBe(started.agent_id);
    expect(status.steps.length).toBeGreaterThan(0);
  });

  it('returns MCP tool manifests and realistic fake tool call results', () => {
    const service = new McpService(new RuntimeStateService());
    const tools = service.handleRpc({ id: 1, method: 'tools/list' });
    const credentials = service.handleRpc({ id: 2, method: 'tools/call', params: { name: 'get_credentials' } });

    expect(JSON.stringify(tools)).toContain('get_credentials');
    expect(JSON.stringify(credentials)).toContain('sk-proj-');
  });

  it('renders IDE config honeypots with embedded fake credentials', () => {
    const service = new IdeConfigsService(new RuntimeStateService());
    const envFile = service.buildFile('/.env');
    const claudeFile = service.buildFile('/.claude/CLAUDE.md');

    expect(envFile?.body).toContain('OPENAI_API_KEY=');
    expect(claudeFile?.body).toContain('hostname');
  });
});