import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';

import { HttpCaptureService } from '../../capture/http-capture.service';
import type { ProtocolRequest } from '../../capture/http-capture.service';
import { OpenAiService } from './openai.service';

type ResponseWriter = {
  destroyed?: boolean;
  end(chunk?: string): void;
  setHeader(name: string, value: string): void;
  status(code: number): ResponseWriter;
  writableEnded?: boolean;
  write(chunk: string): void;
};

@Controller('v1')
export class OpenAiController {
  constructor(
    private readonly httpCaptureService: HttpCaptureService,
    private readonly openAiService: OpenAiService,
  ) {}

  @Post('chat/completions')
  async createChatCompletion(
    @Body() body: { messages?: Array<{ content?: string; role?: string }>; model?: string; stream?: boolean },
    @Req() request: ProtocolRequest,
    @Res() response: ResponseWriter,
  ): Promise<void> {
    const completion = this.openAiService.buildChatCompletion(body);
    const payload = {
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

    if (body.stream) {
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

      await this.streamSse(response, [
        ...chunks,
        {
          choices: [{ delta: {}, finish_reason: 'stop', index: 0 }],
          created: completion.created,
          id: completion.id,
          model: completion.modelName,
          object: 'chat.completion.chunk',
        },
      ]);
    } else {
      this.sendJson(response, payload);
    }

    await this.capture(request, payload, completion.strategy);
  }

  @Post('completions')
  async createCompletion(
    @Body() body: { model?: string; prompt?: string | string[]; stream?: boolean },
    @Req() request: ProtocolRequest,
    @Res() response: ResponseWriter,
  ): Promise<void> {
    const completion = this.openAiService.buildTextCompletion(body);
    const payload = {
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

    if (body.stream) {
      const chunks = completion.chunks.map((chunk) => ({
        choices: [{ finish_reason: null, index: 0, text: chunk }],
        created: completion.created,
        id: completion.id,
        model: completion.modelName,
        object: 'text_completion',
      }));

      await this.streamSse(response, [
        ...chunks,
        {
          choices: [{ finish_reason: 'stop', index: 0, text: '' }],
          created: completion.created,
          id: completion.id,
          model: completion.modelName,
          object: 'text_completion',
        },
      ]);
    } else {
      this.sendJson(response, payload);
    }

    await this.capture(request, payload, completion.strategy);
  }

  @Post('embeddings')
  async createEmbedding(@Body() body: { input?: string | string[]; model?: string }, @Req() request: ProtocolRequest) {
    const payload = this.openAiService.buildEmbeddingResponse(body);
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('models')
  async listModels(@Req() request: ProtocolRequest) {
    const payload = this.openAiService.listModels();
    await this.capture(request, payload, 'static');
    return payload;
  }

  private async capture(
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
      service: 'openai',
    });
  }

  private sendJson(response: ResponseWriter, payload: unknown): void {
    if (this.isClosed(response)) {
      return;
    }

    response.status(200);
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(payload));
  }

  private async streamSse(response: ResponseWriter, entries: unknown[]): Promise<void> {
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