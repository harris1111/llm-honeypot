import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { Readable } from 'node:stream';
import { gzipSync } from 'node:zlib';
import { describe, expect, it, vi } from 'vitest';

import { ArchiveStorageService } from '../src/modules/export/archive-storage.service';

function createService(send = vi.fn()) {
  const service = new ArchiveStorageService();
  (service as unknown as { client: { send: typeof send } | null }).client = { send };

  return {
    service,
  };
}

describe('ArchiveStorageService', () => {
  it('streams a bounded archive preview', async () => {
    const { service } = createService(
      vi.fn().mockResolvedValue({
        Body: Readable.from([gzipSync(Buffer.from('line-1\nline-2\nline-3', 'utf8'))]),
      }),
    );

    await expect(service.readArchivePreview('llmtrap-archive', 'archives/test.jsonl.gz', 2)).resolves.toEqual({
      content: 'line-1\nline-2',
      lineCount: 2,
      truncated: true,
    });
  });

  it('maps missing archive objects to not found errors', async () => {
    const { service } = createService(
      vi.fn().mockRejectedValue({
        $metadata: { httpStatusCode: 404 },
        name: 'NoSuchKey',
      }),
    );

    await expect(service.readArchive('llmtrap-archive', 'archives/missing.jsonl.gz')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps invalid gzip payloads to bad gateway errors', async () => {
    const { service } = createService(
      vi.fn().mockResolvedValue({
        Body: Readable.from([Buffer.from('not-a-gzip-payload', 'utf8')]),
      }),
    );

    await expect(service.readArchive('llmtrap-archive', 'archives/bad.jsonl.gz')).rejects.toBeInstanceOf(BadGatewayException);
  });
});