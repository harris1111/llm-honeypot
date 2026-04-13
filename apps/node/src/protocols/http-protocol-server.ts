import { createServer } from 'node:http';

import { ProtocolCaptureService } from '../capture/protocol-capture.service';
import { listenStreamServer } from './protocol-listener';
import type {
  ProtocolHttpRequest,
  ProtocolHttpResponse,
  ProtocolHttpServiceDefinition,
  ProtocolListenerHandle,
} from './protocol-server.types';

const bodyLimitBytes = 256_000;

function resolveRequestUrl(request: Parameters<ReturnType<typeof createServer>['emit']>[1]): URL {
  const hostHeader = Array.isArray(request.headers.host) ? request.headers.host[0] : request.headers.host;
  const safeHost = typeof hostHeader === 'string' && /^[a-z0-9.:-]+$/i.test(hostHeader) ? hostHeader : 'localhost';
  return new URL(request.url ?? '/', `http://${safeHost}`);
}

function normalizeResponsePayload(response: ProtocolHttpResponse): { headers: Record<string, string>; payload: Buffer | string | object; statusCode: number } {
  if (Buffer.isBuffer(response.body)) {
    return {
      headers: { 'content-type': 'application/octet-stream', ...(response.headers ?? {}) },
      payload: response.body,
      statusCode: response.statusCode ?? 200,
    };
  }

  if (typeof response.body === 'string') {
    return {
      headers: { 'content-type': 'text/plain; charset=utf-8', ...(response.headers ?? {}) },
      payload: response.body,
      statusCode: response.statusCode ?? 200,
    };
  }

  return {
    headers: { 'content-type': 'application/json; charset=utf-8', ...(response.headers ?? {}) },
    payload: response.body,
    statusCode: response.statusCode ?? 200,
  };
}

async function readBody(request: Parameters<ReturnType<typeof createServer>['emit']>[1]): Promise<{ bodyText: string; parsedBody: unknown }> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const nextChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += nextChunk.length;
    if (size > bodyLimitBytes) {
      break;
    }

    chunks.push(nextChunk);
  }

  const bodyText = Buffer.concat(chunks).toString('utf8');
  if (!bodyText.trim()) {
    return { bodyText, parsedBody: undefined };
  }

  const contentType = request.headers['content-type'] ?? '';
  if (contentType.includes('json')) {
    try {
      return { bodyText, parsedBody: JSON.parse(bodyText) };
    } catch {
      return { bodyText, parsedBody: bodyText };
    }
  }

  return { bodyText, parsedBody: bodyText };
}

export async function startHttpProtocolServer(
  definition: ProtocolHttpServiceDefinition,
  protocolCaptureService: ProtocolCaptureService,
): Promise<ProtocolListenerHandle> {
  const server = createServer(async (request, response) => {
    const sourceIp = request.socket.remoteAddress ?? '0.0.0.0';
    let parsedBody: unknown;
    let requestPath = request.url ?? '/';

    try {
      const url = resolveRequestUrl(request);
      requestPath = url.pathname;
      const route = definition.routes.find((candidate) => candidate.method === request.method && candidate.path === url.pathname);
      const requestBody = await readBody(request);
      parsedBody = requestBody.parsedBody;

      const routeRequest: ProtocolHttpRequest = {
        bodyText: requestBody.bodyText,
        headers: request.headers,
        method: request.method ?? 'GET',
        path: url.pathname,
        query: url.searchParams,
        sourceIp,
      };

      let routeResponse: ProtocolHttpResponse;
      try {
        routeResponse = route
          ? route.handle(routeRequest)
          : { body: { error: 'Not found', service: definition.service }, statusCode: 404 };
      } catch {
        routeResponse = { body: { error: 'Internal protocol error', service: definition.service }, statusCode: 500 };
      }

      const normalized = normalizeResponsePayload(routeResponse);
      response.statusCode = normalized.statusCode;
      for (const [name, value] of Object.entries(normalized.headers)) {
        response.setHeader(name, value);
      }

      response.end(typeof normalized.payload === 'object' && !Buffer.isBuffer(normalized.payload) ? JSON.stringify(normalized.payload) : normalized.payload);

      await protocolCaptureService.record({
        headers: request.headers,
        method: request.method ?? 'GET',
        path: requestPath,
        protocol: 'http',
        requestBody: parsedBody,
        responseBody: normalized.payload,
        responseCode: normalized.statusCode,
        service: definition.service,
        sourceIp,
        sourcePort: request.socket.remotePort,
        userAgent: request.headers['user-agent'],
      });
    } catch {
      const errorBody = { error: 'Bad request', service: definition.service };
      response.statusCode = 400;
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(JSON.stringify(errorBody));

      await protocolCaptureService.record({
        headers: request.headers,
        method: request.method ?? 'GET',
        path: requestPath,
        protocol: 'http',
        requestBody: parsedBody,
        responseBody: errorBody,
        responseCode: 400,
        service: definition.service,
        sourceIp,
        sourcePort: request.socket.remotePort,
        userAgent: request.headers['user-agent'],
      });
    }
  });

  server.on('clientError', (_error, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  return listenStreamServer(definition.service, definition.port, server);
}