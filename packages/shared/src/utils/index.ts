import { randomUUID } from 'node:crypto';

export function createTraceId(prefix = 'trace'): string {
  return `${prefix}_${randomUUID()}`;
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}