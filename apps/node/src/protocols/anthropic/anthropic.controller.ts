import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';

import { HttpCaptureService } from '../../capture/http-capture.service';
import type { ProtocolRequest } from '../../capture/http-capture.service';
import { AnthropicService } from './anthropic.service';

type ResponseWriter = {
  destroyed?: boolean;
  end(chunk?: string): void;
  setHeader(name: string, value: string): void;
  status(code: number): ResponseWriter;
  writableEnded?: boolean;
  write(chunk: string): void;
};

@Controller()
export class AnthropicController {
  constructor(
    private readonly anthropicService: AnthropicService,
    private readonly httpCaptureService: HttpCaptureService,
  ) {}

  @Get('v1/models')
  async listModels(@Req() request: ProtocolRequest) {
    const payload = this.anthropicService.listModels();
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Post('anthropic/v1/messages')
  async createAnthropicMessagesAlias(
    @Body() body: { messages?: Array<{ content?: string | Array<{ text?: string; type?: string }>; role?: string }>; model?: string; stream?: boolean },
    @Req() request: ProtocolRequest,
    @Res() response: ResponseWriter,
  ): Promise<void> {
    await this.handleMessages(body, request, response);
  }

  @Post('v1/messages')
  async createMessages(
    @Body() body: { messages?: Array<{ content?: string | Array<{ text?: string; type?: string }>; role?: string }>; model?: string; stream?: boolean },
    @Req() request: ProtocolRequest,
    @Res() response: ResponseWriter,
  ): Promise<void> {
    await this.handleMessages(body, request, response);
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
      service: 'anthropic',
    });
  }

  private async handleMessages(
    body: { messages?: Array<{ content?: string | Array<{ text?: string; type?: string }>; role?: string }>; model?: string; stream?: boolean },
    request: ProtocolRequest,
    response: ResponseWriter,
  ): Promise<void> {
    const message = this.anthropicService.buildMessageResponse(body);
    const payload = {
      content: [{ text: message.content, type: 'text' }],
      id: message.id,
      model: message.modelName,
      role: 'assistant',
      stop_reason: 'end_turn',
      stop_sequence: null,
      type: 'message',
      usage: {
        input_tokens: message.promptTokens,
        output_tokens: message.chunks.length,
      },
    };

    if (body.stream) {
      await this.streamSse(response, message);
    } else {
      this.sendJson(response, payload);
    }

    await this.capture(request, payload, message.strategy);
  }

  private sendJson(response: ResponseWriter, payload: unknown): void {
    if (this.isClosed(response)) {
      return;
    }

    response.status(200);
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(payload));
  }

  private async streamSse(
    response: ResponseWriter,
    message: { chunks: string[]; content: string; id: string; modelName: string; promptTokens: number },
  ): Promise<void> {
    if (this.isClosed(response)) {
      return;
    }

    response.status(200);
    response.setHeader('content-type', 'text/event-stream');

    if (
      !this.writeIfOpen(
        response,
        `event: message_start\ndata: ${JSON.stringify({
          message: {
            content: [],
            id: message.id,
            model: message.modelName,
            role: 'assistant',
            type: 'message',
            usage: { input_tokens: message.promptTokens, output_tokens: 0 },
          },
          type: 'message_start',
        })}\n\n`,
      ) ||
      !this.writeIfOpen(
        response,
        `event: content_block_start\ndata: ${JSON.stringify({
          content_block: { text: '', type: 'text' },
          index: 0,
          type: 'content_block_start',
        })}\n\n`,
      )
    ) {
      return;
    }

    for (const chunk of message.chunks) {
      if (this.isClosed(response)) {
        return;
      }

      if (
        !this.writeIfOpen(
          response,
          `event: content_block_delta\ndata: ${JSON.stringify({
            delta: { text: chunk, type: 'text_delta' },
            index: 0,
            type: 'content_block_delta',
          })}\n\n`,
        )
      ) {
        return;
      }

      await this.wait(60);
    }

    if (this.isClosed(response)) {
      return;
    }

    if (
      !this.writeIfOpen(
        response,
        `event: content_block_stop\ndata: ${JSON.stringify({ index: 0, type: 'content_block_stop' })}\n\n`,
      ) ||
      !this.writeIfOpen(
        response,
        `event: message_delta\ndata: ${JSON.stringify({
          delta: { stop_reason: 'end_turn' },
          type: 'message_delta',
          usage: { output_tokens: message.chunks.length },
        })}\n\n`,
      )
    ) {
      return;
    }

    if (!this.isClosed(response)) {
      response.end(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
    }
  }

  private isClosed(response: ResponseWriter): boolean {
    return response.destroyed === true || response.writableEnded === true;
  }

  private writeIfOpen(response: ResponseWriter, chunk: string): boolean {
    if (this.isClosed(response)) {
      return false;
    }

    response.write(chunk);
    return !this.isClosed(response);
  }

  private wait(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, durationMs);
    });
  }
}