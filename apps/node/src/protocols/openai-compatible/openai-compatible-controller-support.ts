import type { ProtocolService } from '@llmtrap/shared';

import { HttpCaptureService } from '../../capture/http-capture.service';
import type { ProtocolRequest } from '../../capture/http-capture.service';
import type { CompletionResult } from './openai-compatible.service';

export type ResponseWriter = {
  destroyed?: boolean;
  end(chunk?: string): void;
  setHeader(name: string, value: string): void;
  status(code: number): ResponseWriter;
  writableEnded?: boolean;
  write(chunk: string): void;
};

export class OpenAiCompatibleControllerSupport {
  constructor(
    private readonly httpCaptureService: HttpCaptureService,
    private readonly serviceName: ProtocolService,
  ) {}

  protected async capture(
    request: ProtocolRequest,
    responseBody: unknown,
    responseStrategy: 'static' | 'template',
  ): Promise<void> {
    await this.httpCaptureService.recordInteraction({
      protocol: 'http',
      request,
      responseBody,
      responseCode: 200,
      responseStrategy,
      service: this.serviceName,
    });
  }

  protected sendJson(response: ResponseWriter, payload: unknown): void {
    if (this.isClosed(response)) {
      return;
    }

    response.status(200);
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(payload));
  }

  protected async streamSse(response: ResponseWriter, entries: unknown[]): Promise<void> {
    response.status(200);
    response.setHeader('content-type', 'text/event-stream');

    for (const entry of entries) {
      if (this.isClosed(response)) {
        return;
      }

      response.write(`data: ${JSON.stringify(entry)}\n\n`);
      await this.wait(60);
    }

    if (!this.isClosed(response)) {
      response.end('data: [DONE]\n\n');
    }
  }

  private isClosed(response: ResponseWriter): boolean {
    return response.destroyed === true || response.writableEnded === true;
  }

  private wait(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, durationMs);
    });
  }
}

export function createChatCompletionPayload(completion: CompletionResult) {
  return {
    choices: [
      {
        finish_reason: 'stop',
        index: 0,
        message: { content: completion.content, role: 'assistant' },
      },
    ],
    created: completion.created,
    id: completion.id,
    model: completion.modelName,
    object: 'chat.completion',
    usage: {
      completion_tokens: completion.chunks.length,
      prompt_tokens: completion.promptTokens,
      total_tokens: completion.promptTokens + completion.chunks.length,
    },
  };
}

export function createChatCompletionStreamEntries(completion: CompletionResult): unknown[] {
  const chunks = completion.chunks.map((chunk, index) => ({
    choices: [
      {
        delta: index === 0 ? { content: chunk, role: 'assistant' } : { content: chunk },
        finish_reason: null,
        index: 0,
      },
    ],
    created: completion.created,
    id: completion.id,
    model: completion.modelName,
    object: 'chat.completion.chunk',
  }));

  return [
    ...chunks,
    {
      choices: [{ delta: {}, finish_reason: 'stop', index: 0 }],
      created: completion.created,
      id: completion.id,
      model: completion.modelName,
      object: 'chat.completion.chunk',
    },
  ];
}

export function createTextCompletionPayload(completion: CompletionResult) {
  return {
    choices: [{ finish_reason: 'stop', index: 0, text: completion.content }],
    created: completion.created,
    id: completion.id,
    model: completion.modelName,
    object: 'text_completion',
    usage: {
      completion_tokens: completion.chunks.length,
      prompt_tokens: completion.promptTokens,
      total_tokens: completion.promptTokens + completion.chunks.length,
    },
  };
}

export function createTextCompletionStreamEntries(completion: CompletionResult): unknown[] {
  const chunks = completion.chunks.map((chunk) => ({
    choices: [{ finish_reason: null, index: 0, text: chunk }],
    created: completion.created,
    id: completion.id,
    model: completion.modelName,
    object: 'text_completion',
  }));

  return [
    ...chunks,
    {
      choices: [{ finish_reason: 'stop', index: 0, text: '' }],
      created: completion.created,
      id: completion.id,
      model: completion.modelName,
      object: 'text_completion',
    },
  ];
}