import { Body, Controller, Get, Post, Req } from '@nestjs/common';

import { HttpCaptureService } from '../../capture/http-capture.service';
import type { ProtocolRequest } from '../../capture/http-capture.service';
import {
  getRequestSourceIp,
  OpenAiCompatibleControllerSupport,
} from '../openai-compatible/openai-compatible-controller-support';
import { TextGenerationWebuiService } from './text-generation-webui.service';

@Controller()
export class TextGenerationWebuiController extends OpenAiCompatibleControllerSupport {
  constructor(
    httpCaptureService: HttpCaptureService,
    private readonly textGenerationWebuiService: TextGenerationWebuiService,
  ) {
    super(httpCaptureService, 'text-generation-webui');
  }

  @Post('api/v1/generate')
  async generate(@Body() body: { max_new_tokens?: number; prompt?: string }, @Req() request: ProtocolRequest) {
    const result = await this.textGenerationWebuiService.buildGenerateResponse(body, getRequestSourceIp(request));
    const payload = { results: [{ text: result.content }] };

    await this.capture(request, payload, result.strategy);
    return payload;
  }

  @Post('api/v1/chat')
  async chat(
    @Body() body: { messages?: Array<{ content?: string }>; mode?: string; prompt?: string },
    @Req() request: ProtocolRequest,
  ) {
    const result = await this.textGenerationWebuiService.buildChatResponse(body, getRequestSourceIp(request));
    const payload = { results: [{ text: result.content }] };

    await this.capture(request, payload, result.strategy);
    return payload;
  }

  @Get('api/v1/model')
  async getModel(@Req() request: ProtocolRequest) {
    const payload = this.textGenerationWebuiService.getCurrentModel();

    await this.capture(request, payload, 'static');
    return payload;
  }
}