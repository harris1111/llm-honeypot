import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';

import { HttpCaptureService } from '../../capture/http-capture.service';
import type { ProtocolRequest } from '../../capture/http-capture.service';
import {
  OpenAiCompatibleControllerSupport,
  type ResponseWriter,
} from '../openai-compatible/openai-compatible-controller-support';
import { LangserveService } from './langserve.service';

@Controller()
export class LangserveController extends OpenAiCompatibleControllerSupport {
  constructor(
    httpCaptureService: HttpCaptureService,
    private readonly langserveService: LangserveService,
  ) {
    super(httpCaptureService, 'langserve');
  }

  @Post('invoke')
  async invoke(@Body() body: unknown, @Req() request: ProtocolRequest) {
    const result = this.langserveService.buildInvokeResponse(body);
    const payload = {
      metadata: { run_id: result.id },
      output: { answer: result.content },
    };

    await this.capture(request, payload, result.strategy);
    return payload;
  }

  @Post('stream')
  async stream(@Body() body: unknown, @Req() request: ProtocolRequest, @Res() response: ResponseWriter): Promise<void> {
    const result = this.langserveService.buildInvokeResponse(body);
    const payload = {
      metadata: { run_id: result.id },
      output: { answer: result.content },
    };

    await this.streamSse(
      response,
      result.chunks.map((chunk) => ({ output: chunk })),
    );

    await this.capture(request, payload, result.strategy);
  }

  @Post('batch')
  async batch(@Body() body: unknown[], @Req() request: ProtocolRequest) {
    const payload = this.langserveService.buildBatchResponse(body);
    await this.capture(request, payload, 'template');
    return payload;
  }

  @Get('input_schema')
  async inputSchema(@Req() request: ProtocolRequest) {
    const payload = this.langserveService.getInputSchema();
    await this.capture(request, payload, 'static');
    return payload;
  }

  @Get('output_schema')
  async outputSchema(@Req() request: ProtocolRequest) {
    const payload = this.langserveService.getOutputSchema();
    await this.capture(request, payload, 'static');
    return payload;
  }
}