import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Readable } from 'node:stream';
import { buffer as readBuffer } from 'node:stream/consumers';
import { createInterface } from 'node:readline';
import { createGunzip, gunzipSync } from 'node:zlib';

import { apiConfig } from '../../config/env-config';

export type ArchivePreviewResult = {
  content: string;
  lineCount: number;
  truncated: boolean;
};

@Injectable()
export class ArchiveStorageService {
  private readonly client = this.isConfigured()
    ? new S3Client({
        credentials: {
          accessKeyId: apiConfig.env.S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: apiConfig.env.S3_SECRET_ACCESS_KEY ?? '',
        },
        endpoint: apiConfig.env.S3_ENDPOINT,
        forcePathStyle: apiConfig.env.S3_FORCE_PATH_STYLE ?? false,
        region: apiConfig.env.S3_REGION ?? 'auto',
      })
    : null;

  async readArchive(bucket: string, storageKey: string): Promise<string> {
    if (!this.client) {
      throw new ServiceUnavailableException('Archive storage is not configured');
    }

    try {
      const response = await this.getArchiveObject(bucket, storageKey);
      const bytes = await readBuffer(this.asReadable(response.Body));

      return gunzipSync(bytes).toString('utf8');
    } catch (error) {
      throw this.mapStorageError(error);
    }
  }

  async readArchivePreview(bucket: string, storageKey: string, previewLines: number): Promise<ArchivePreviewResult> {
    if (!this.client) {
      throw new ServiceUnavailableException('Archive storage is not configured');
    }

    const maxPreviewLines = Math.max(1, Math.min(Math.floor(previewLines), 500));

    try {
      const response = await this.getArchiveObject(bucket, storageKey);
      const body = this.asReadable(response.Body);
      const gunzip = createGunzip();
      const lineReader = createInterface({
        crlfDelay: Infinity,
        input: body.pipe(gunzip),
      });
      const lines: string[] = [];

      try {
        for await (const line of lineReader) {
          lines.push(line);
          if (lines.length > maxPreviewLines) {
            break;
          }
        }
      } finally {
        lineReader.close();
      }

      const truncated = lines.length > maxPreviewLines;
      if (truncated) {
        lines.length = maxPreviewLines;
        body.destroy();
        gunzip.destroy();
      }

      return {
        content: lines.join('\n'),
        lineCount: lines.length,
        truncated,
      };
    } catch (error) {
      throw this.mapStorageError(error);
    }
  }

  private asReadable(body: unknown): Readable {
    if (!body) {
      throw new ServiceUnavailableException('Archive content is unavailable');
    }

    if (body instanceof Readable) {
      return body;
    }

    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
      return Readable.from([body]);
    }

    if (typeof body === 'object' && body !== null) {
      if (typeof (body as { pipe?: unknown }).pipe === 'function') {
        return body as Readable;
      }

      if (Symbol.asyncIterator in body) {
        return Readable.from(body as AsyncIterable<Uint8Array>);
      }
    }

    throw new ServiceUnavailableException('Archive content is unavailable');
  }

  private async getArchiveObject(bucket: string, storageKey: string) {
    if (!this.client) {
      throw new ServiceUnavailableException('Archive storage is not configured');
    }

    return this.client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      }),
    );
  }

  private isConfigured(): boolean {
    return Boolean(
      apiConfig.env.S3_BUCKET &&
        apiConfig.env.S3_ENDPOINT &&
        apiConfig.env.S3_ACCESS_KEY_ID &&
        apiConfig.env.S3_SECRET_ACCESS_KEY,
    );
  }

  private mapStorageError(error: unknown) {
    if (
      error instanceof BadGatewayException ||
      error instanceof NotFoundException ||
      error instanceof ServiceUnavailableException
    ) {
      return error;
    }

    const errorRecord = (typeof error === 'object' && error !== null ? error : {}) as {
      $metadata?: { httpStatusCode?: number };
      code?: string;
      name?: string;
    };
    const errorCode = errorRecord.code ?? errorRecord.name ?? '';
    const errorMessage = error instanceof Error ? error.message : '';

    if (errorCode === 'NoSuchKey' || errorCode === 'NotFound' || errorRecord.$metadata?.httpStatusCode === 404) {
      return new NotFoundException('Archive content is unavailable');
    }

    if (/gzip|header check|invalid|incorrect data check|unexpected end of file/i.test(errorMessage)) {
      return new BadGatewayException('Archive content is unreadable');
    }

    return new ServiceUnavailableException('Archive storage is unavailable');
  }
}