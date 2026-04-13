import type { IncomingHttpHeaders } from 'node:http';
import type { ProtocolService } from '@llmtrap/shared';

export interface ProtocolListenerHandle {
  close(): Promise<void>;
  name: string;
}

export interface ProtocolHttpRequest {
  bodyText: string;
  headers: IncomingHttpHeaders;
  method: string;
  path: string;
  query: URLSearchParams;
  sourceIp: string;
}

export interface ProtocolHttpResponse {
  body: Buffer | object | string;
  headers?: Record<string, string>;
  statusCode?: number;
}

export interface ProtocolHttpRoute {
  handle: (request: ProtocolHttpRequest) => ProtocolHttpResponse;
  method: 'GET' | 'POST';
  path: string;
}

export interface ProtocolHttpServiceDefinition {
  port: number;
  routes: ProtocolHttpRoute[];
  service: ProtocolService;
}