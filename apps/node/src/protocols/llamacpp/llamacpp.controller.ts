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
import { LlamacppService } from './llamacpp.service';

@Controller()
export class LlamacppController extends OpenAiCompatibleControllerSupport {
  constructor(
    httpCaptureService: HttpCaptureService,
    private readonly llamacppService: LlamacppService,
  ) {
    super(httpCaptureService, 'llamacpp');
  }

  @Post('v1/chat/completions')
  async createChatCompletion(
    @Body() body: { messages?: Array<{ content?: string; role?: string }>; model?: string; stream?: boolean },
    @Req() request: ProtocolRequest,
    @Res() response: ResponseWriter,
  ): Promise<void> {
    const completion = this.llamacppService.buildChatCompletion(body);
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
    const completion = this.llamacppService.buildTextCompletion(body);
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
    const payload = this.llamacppService.buildEmbeddingResponse(body);
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('v1/models')
  async listModels(@Req() request: ProtocolRequest) {
    const payload = this.llamacppService.listModels();
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('health')
  async health(@Req() request: ProtocolRequest) {
    const payload = { status: 'ok' };
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('slots')
  async listSlots(@Req() request: ProtocolRequest) {
    const payload = this.llamacppService.listSlots();
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Post('completion')
  async createLegacyCompletion(
    @Body() body: { model?: string; prompt?: string | string[] },
    @Req() request: ProtocolRequest,
    @Res() response: ResponseWriter,
  ): Promise<void> {
    const completion = this.llamacppService.buildTextCompletion(body);
    const payload = {
      content: completion.content,
      generation_settings: { n_predict: 128 },
      model: completion.modelName,
      prompt_tokens: completion.promptTokens,
      stopped_eos: true,
      tokens_predicted: completion.chunks.length,
      truncated: false,
    };

    this.sendJson(response, payload);
    await this.capture(request, payload, completion.strategy);
  }
}