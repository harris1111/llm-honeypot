import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';

import { HttpCaptureService } from '../../capture/http-capture.service';
import type { ProtocolRequest } from '../../capture/http-capture.service';
import {
  createChatCompletionPayload,
  createChatCompletionStreamEntries,
  createTextCompletionPayload,
  createTextCompletionStreamEntries,
  OpenAiCompatibleControllerSupport,
  type ResponseWriter,
} from '../openai-compatible/openai-compatible-controller-support';
import { VllmService } from './vllm.service';

@Controller()
export class VllmController extends OpenAiCompatibleControllerSupport {
  constructor(
    httpCaptureService: HttpCaptureService,
    private readonly vllmService: VllmService,
  ) {
    super(httpCaptureService, 'vllm');
  }

  @Post('v1/chat/completions')
  async createChatCompletion(
    @Body() body: { messages?: Array<{ content?: string; role?: string }>; model?: string; stream?: boolean },
    @Req() request: ProtocolRequest,
    @Res() response: ResponseWriter,
  ): Promise<void> {
    const completion = this.vllmService.buildChatCompletion(body);
    const payload = createChatCompletionPayload(completion);

    if (body.stream) {
      await this.streamSse(response, createChatCompletionStreamEntries(completion));
    } else {
      this.sendJson(response, payload);
    }

    await this.capture(request, payload, completion.strategy);
  }

  @Post('v1/completions')
  async createCompletion(
    @Body() body: { model?: string; prompt?: string | string[]; stream?: boolean },
    @Req() request: ProtocolRequest,
    @Res() response: ResponseWriter,
  ): Promise<void> {
    const completion = this.vllmService.buildTextCompletion(body);
    const payload = createTextCompletionPayload(completion);

    if (body.stream) {
      await this.streamSse(response, createTextCompletionStreamEntries(completion));
    } else {
      this.sendJson(response, payload);
    }

    await this.capture(request, payload, completion.strategy);
  }

  @Post('v1/embeddings')
  async createEmbedding(@Body() body: { input?: string | string[]; model?: string }, @Req() request: ProtocolRequest) {
    const payload = this.vllmService.buildEmbeddingResponse(body);
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('v1/models')
  async listModels(@Req() request: ProtocolRequest) {
    const payload = this.vllmService.listModels();
    await this.capture(request, payload, 'static');
    return payload;
  }
}