import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';

import { HttpCaptureService } from '../../capture/http-capture.service';
import type { ProtocolRequest } from '../../capture/http-capture.service';
import {
  createChatCompletionPayload,
  createChatCompletionStreamEntries,
  createTextCompletionPayload,
  createTextCompletionStreamEntries,
  getRequestSourceIp,
  OpenAiCompatibleControllerSupport,
  type ResponseWriter,
} from '../openai-compatible/openai-compatible-controller-support';
import { LmStudioService } from './lm-studio.service';

@Controller()
export class LmStudioController extends OpenAiCompatibleControllerSupport {
  constructor(
    httpCaptureService: HttpCaptureService,
    private readonly lmStudioService: LmStudioService,
  ) {
    super(httpCaptureService, 'lm-studio');
  }

  @Post('v1/chat/completions')
  async createChatCompletion(
    @Body() body: { messages?: Array<{ content?: string; role?: string }>; model?: string; stream?: boolean },
    @Req() request: ProtocolRequest,
    @Res() response: ResponseWriter,
  ): Promise<void> {
    const completion = await this.lmStudioService.buildChatCompletion(body, getRequestSourceIp(request));
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
    const completion = await this.lmStudioService.buildTextCompletion(body, getRequestSourceIp(request));
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
    const payload = this.lmStudioService.buildEmbeddingResponse(body);
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('v1/models')
  async listModels(@Req() request: ProtocolRequest) {
    const payload = this.lmStudioService.listModels();
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('lmstudio/models/list')
  async listLmStudioModels(@Req() request: ProtocolRequest) {
    const payload = this.lmStudioService.listModels();
    await this.capture(request, payload, 'static');
    return payload;
  }
}