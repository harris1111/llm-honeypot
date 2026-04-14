import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';

import { HttpCaptureService } from '../../capture/http-capture.service';
import type { ProtocolRequest } from '../../capture/http-capture.service';
import { OllamaService } from './ollama.service';

type ResponseWriter = {
  destroyed?: boolean;
  end(chunk?: string): void;
  setHeader(name: string, value: string): void;
  status(code: number): ResponseWriter;
  writableEnded?: boolean;
  write(chunk: string): void;
};

@Controller('api')
export class OllamaController {
  constructor(
    private readonly httpCaptureService: HttpCaptureService,
    private readonly ollamaService: OllamaService,
  ) {}

  @Post('chat')
  async chat(
    @Body() body: { messages?: Array<{ content?: string; role?: string }>; model?: string; stream?: boolean },
    @Req() request: ProtocolRequest,
    @Res() response: ResponseWriter,
  ): Promise<void> {
    const completion = await this.ollamaService.buildChatResponse(body, request.ip ?? request.socket?.remoteAddress);
    const payload = {
      created_at: completion.createdAt,
      done: true,
      done_reason: 'stop',
      message: { content: completion.content, role: 'assistant' },
      model: completion.modelName,
      total_duration: completion.totalDuration,
    };

    if (body.stream !== false) {
      const chunks = completion.chunks.map((chunk, index) => ({
        created_at: completion.createdAt,
        done: false,
        message: { content: chunk, role: index === 0 ? 'assistant' : undefined },
        model: completion.modelName,
      }));

      await this.streamNdjson(response, [...chunks, payload]);
    } else {
      this.sendJson(response, payload);
    }

    await this.httpCaptureService.recordInteraction({
      protocol: 'http',
      request,
      responseBody: payload,
      responseCode: 200,
      responseStrategy: completion.strategy,
      service: 'ollama',
    });
  }

  @Post('generate')
  async generate(
    @Body() body: { model?: string; prompt?: string; stream?: boolean },
    @Req() request: ProtocolRequest,
    @Res() response: ResponseWriter,
  ): Promise<void> {
    const completion = await this.ollamaService.buildGenerateResponse(body, request.ip ?? request.socket?.remoteAddress);
    const payload = {
      created_at: completion.createdAt,
      done: true,
      done_reason: 'stop',
      eval_count: completion.evalCount,
      model: completion.modelName,
      prompt_eval_count: completion.promptEvalCount,
      response: completion.content,
      total_duration: completion.totalDuration,
    };

    if (body.stream !== false) {
      const chunks = completion.chunks.map((chunk) => ({
        created_at: completion.createdAt,
        done: false,
        model: completion.modelName,
        response: chunk,
      }));

      await this.streamNdjson(response, [...chunks, payload]);
    } else {
      this.sendJson(response, payload);
    }

    await this.httpCaptureService.recordInteraction({
      protocol: 'http',
      request,
      responseBody: payload,
      responseCode: 200,
      responseStrategy: completion.strategy,
      service: 'ollama',
    });
  }

  @Get('ps')
  async getProcesses(@Req() request: ProtocolRequest) {
    const payload = this.ollamaService.getProcessList();
    await this.httpCaptureService.recordInteraction({
      protocol: 'http',
      request,
      responseBody: payload,
      responseCode: 200,
      responseStrategy: 'static',
      service: 'ollama',
    });
    return payload;
  }

  @Get('tags')
  async getTags(@Req() request: ProtocolRequest) {
    const payload = this.ollamaService.getModels();
    await this.httpCaptureService.recordInteraction({
      protocol: 'http',
      request,
      responseBody: payload,
      responseCode: 200,
      responseStrategy: 'static',
      service: 'ollama',
    });
    return payload;
  }

  @Get('version')
  async getVersion(@Req() request: ProtocolRequest) {
    const payload = this.ollamaService.getVersion();
    await this.httpCaptureService.recordInteraction({
      protocol: 'http',
      request,
      responseBody: payload,
      responseCode: 200,
      responseStrategy: 'static',
      service: 'ollama',
    });
    return payload;
  }

  @Post('pull')
  async pull(@Body() body: { name?: string }, @Req() request: ProtocolRequest) {
    const payload = this.ollamaService.pullModel(body);
    await this.httpCaptureService.recordInteraction({
      protocol: 'http',
      request,
      responseBody: payload,
      responseCode: 200,
      responseStrategy: 'static',
      service: 'ollama',
    });
    return payload;
  }

  @Post('show')
  async show(@Body() body: { name?: string }, @Req() request: ProtocolRequest) {
    const payload = this.ollamaService.showModel(body);
    await this.httpCaptureService.recordInteraction({
      protocol: 'http',
      request,
      responseBody: payload,
      responseCode: 200,
      responseStrategy: 'static',
      service: 'ollama',
    });
    return payload;
  }

  private async streamNdjson(response: ResponseWriter, entries: unknown[]): Promise<void> {
    response.status(200);
    response.setHeader('content-type', 'application/x-ndjson');

    for (const entry of entries) {
      if (this.isClosed(response)) {
        return;
      }

      response.write(`${JSON.stringify(entry)}\n`);
      await this.wait(60);
    }

    if (!this.isClosed(response)) {
      response.end();
    }
  }

  private sendJson(response: ResponseWriter, payload: unknown): void {
    if (this.isClosed(response)) {
      return;
    }

    response.status(200);
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(payload));
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