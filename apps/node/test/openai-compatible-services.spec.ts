import { describe, expect, it } from 'vitest';

import { RuntimeStateService } from '../src/runtime/runtime-state.service';
import { AutogptService } from '../src/protocols/autogpt/autogpt.service';
import { IdeConfigsService } from '../src/protocols/ide-configs/ide-configs.service';
import { LangserveService } from '../src/protocols/langserve/langserve.service';
import { LlamacppService } from '../src/protocols/llamacpp/llamacpp.service';
import { LmStudioService } from '../src/protocols/lm-studio/lm-studio.service';
import { McpService } from '../src/protocols/mcp/mcp.service';
import { TextGenerationWebuiService } from '../src/protocols/text-generation-webui/text-generation-webui.service';
import { VllmService } from '../src/protocols/vllm/vllm.service';

describe('Phase 4 openai-compatible services', () => {
  it('routes unmatched LM Studio prompts through the lm-studio service label', () => {
    const service = new LmStudioService(new RuntimeStateService());
    const completion = service.buildTextCompletion({ prompt: 'zzqv97 unmatched token' });

    expect(completion.content).toContain('lm-studio');
  });

  it('routes unmatched llama.cpp prompts through the llamacpp service label', () => {
    const service = new LlamacppService(new RuntimeStateService());
    const completion = service.buildTextCompletion({ prompt: 'zzqv97 unmatched token' });

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

  it('routes unmatched vLLM prompts through the vllm service label', () => {
    const service = new VllmService(new RuntimeStateService());
    const completion = service.buildTextCompletion({ prompt: 'zzqv97 unmatched token' });

    expect(completion.content).toContain('vllm');
  });

  it('routes unmatched text-generation-webui prompts through the text-generation-webui service label', () => {
    const service = new TextGenerationWebuiService(new RuntimeStateService());
    const response = service.buildGenerateResponse({ prompt: 'zzqv97 unmatched token' });

    expect(response.content).toContain('text-generation-webui');
  });

  it('routes unmatched LangServe prompts through the langserve service label', () => {
    const service = new LangserveService(new RuntimeStateService());
    const response = service.buildInvokeResponse({ input: { question: 'zzqv97 unmatched token' } });

    expect(response.content).toContain('langserve');
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