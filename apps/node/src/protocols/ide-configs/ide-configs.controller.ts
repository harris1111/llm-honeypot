import { Controller, Get, Req, Res } from '@nestjs/common';

import { HttpCaptureService } from '../../capture/http-capture.service';
import type { ProtocolRequest } from '../../capture/http-capture.service';
import {
  OpenAiCompatibleControllerSupport,
  type ResponseWriter,
} from '../openai-compatible/openai-compatible-controller-support';
import { ideConfigRoutePaths } from './ide-config-templates';
import { IdeConfigsService } from './ide-configs.service';

@Controller()
export class IdeConfigsController extends OpenAiCompatibleControllerSupport {
  constructor(
    httpCaptureService: HttpCaptureService,
    private readonly ideConfigsService: IdeConfigsService,
  ) {
    super(httpCaptureService, 'ide-configs');
  }

  @Get(ideConfigRoutePaths)
  async getConfig(@Req() request: ProtocolRequest, @Res() response: ResponseWriter): Promise<void> {
    const path = request.originalUrl ?? request.url ?? '/';
    const payload = this.ideConfigsService.buildFile(path);

    if (!payload) {
      response.status(404);
      response.end('Not found');
      return;
    }

    response.status(200);
    response.setHeader('content-type', payload.contentType);
    response.end(payload.body);

    await this.capture(request, payload.body, 'static');
  }
}