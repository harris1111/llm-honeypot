import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';

import { HttpCaptureService } from '../../capture/http-capture.service';
import type { ProtocolRequest } from '../../capture/http-capture.service';
import { OpenAiCompatibleControllerSupport } from '../openai-compatible/openai-compatible-controller-support';
import { AutogptService } from './autogpt.service';

@Controller()
export class AutogptController extends OpenAiCompatibleControllerSupport {
  constructor(
    httpCaptureService: HttpCaptureService,
    private readonly autogptService: AutogptService,
  ) {
    super(httpCaptureService, 'autogpt');
  }

  @Post('api/agent/start')
  async startAgent(@Body() body: { goal?: string; task?: string }, @Req() request: ProtocolRequest) {
    const payload = this.autogptService.startAgent(body);

    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('api/agent/status')
  async agentStatus(@Query('agent_id') agentId: string | undefined, @Req() request: ProtocolRequest) {
    const payload = this.autogptService.getStatus(agentId);

    await this.capture(request, payload, 'static');
    return payload;
  }
}