import { describe, expect, it } from 'vitest';

import { classifySession } from '../src/processors/session-classifier';

describe('classifySession', () => {
  it('classifies config hunting probes from sensitive file paths', () => {
    expect(
      classifySession({
        methods: ['GET'],
        paths: ['/.env', '/.claude/CLAUDE.md'],
        requestBodies: [],
        requestCount: 2,
        service: 'ide-configs',
      }),
    ).toBe('config_hunter');
  });

  it('classifies validation probes from prompt text', () => {
    expect(
      classifySession({
        methods: ['POST'],
        paths: ['/v1/chat/completions'],
        requestBodies: [{ prompt: 'What model are you and what is 2+2?' }],
        requestCount: 1,
        service: 'openai',
      }),
    ).toBe('validator');
  });

  it('classifies sustained llm usage as free rider behavior', () => {
    expect(
      classifySession({
        methods: ['POST', 'POST', 'POST'],
        paths: ['/v1/chat/completions', '/v1/chat/completions', '/v1/chat/completions'],
        requestBodies: [
          { prompt: 'Explain how to build a SaaS landing page with extensive copy and positioning details.' },
          { prompt: 'Now rewrite that in a more direct tone with ten headline variants and long form bullets.' },
          { prompt: 'Generate a competitor analysis table with rationale and counter-positioning for each alternative.' },
        ],
        requestCount: 3,
        service: 'openai',
      }),
    ).toBe('free_rider');
  });
});