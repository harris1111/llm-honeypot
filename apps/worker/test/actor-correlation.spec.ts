import { describe, expect, it } from 'vitest';

import { scoreActorMatch } from '../src/processors/actor-correlation';

describe('scoreActorMatch', () => {
  it('returns a strong score for close matches', () => {
    expect(
      scoreActorMatch(
        {
          headerFingerprint: 'hdr-1',
          paths: ['/v1/models', '/health'],
          tlsFingerprint: 'tls-1',
          userAgent: 'scanner/1.0',
        },
        {
          headerFingerprint: 'hdr-1',
          paths: ['/health', '/v1/models'],
          tlsFingerprints: ['tls-1'],
          userAgents: ['scanner/1.0'],
        },
      ),
    ).toBe(100);
  });

  it('returns a weak score for unrelated signals', () => {
    expect(
      scoreActorMatch(
        {
          headerFingerprint: 'hdr-2',
          paths: ['/invoke'],
          tlsFingerprint: 'tls-2',
          userAgent: 'curl/8.0',
        },
        {
          headerFingerprint: 'hdr-1',
          paths: ['/health'],
          tlsFingerprints: ['tls-1'],
          userAgents: ['scanner/1.0'],
        },
      ),
    ).toBe(0);
  });
});