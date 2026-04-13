import { describe, expect, it } from 'vitest';

import { matchesAlertConditions } from '../src/processors/alert-evaluator';

const candidate = {
  actorId: 'actor-1',
  classification: 'attacker',
  nodeId: 'node-1',
  paths: ['/shell', '/.env'],
  requestCount: 8,
  service: 'openai',
  sourceIp: '203.0.113.5',
};

describe('matchesAlertConditions', () => {
  it('matches convenience keys', () => {
    expect(
      matchesAlertConditions(
        {
          classification: ['attacker', 'config_hunter'],
          minRequestCount: 5,
          service: ['openai'],
        },
        candidate,
      ),
    ).toBe(true);
  });

  it('matches rules arrays with operators', () => {
    expect(
      matchesAlertConditions(
        {
          rules: [
            { field: 'classification', operator: 'eq', value: 'attacker' },
            { field: 'requestCount', operator: 'gte', value: 5 },
            { field: 'sourceIp', operator: 'matches', value: '^203\\.' },
          ],
        },
        candidate,
      ),
    ).toBe(true);
  });

  it('rejects mismatched conditions', () => {
    expect(matchesAlertConditions({ classification: 'validator' }, candidate)).toBe(false);
  });
});