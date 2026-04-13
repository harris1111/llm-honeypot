import { Injectable } from '@nestjs/common';

import { RuntimeStateService } from '../../runtime/runtime-state.service';
import { TemplateProtocolService } from '../template-protocol/template-protocol.service';

@Injectable()
export class TextGenerationWebuiService extends TemplateProtocolService {
  protected readonly serviceName = 'text-generation-webui' as const;

  constructor(runtimeStateService: RuntimeStateService) {
    super(runtimeStateService);
  }

  buildChatResponse(body: { messages?: Array<{ content?: string }>; prompt?: string }) {
    const prompt = body.messages?.map((message) => message.content ?? '').join(' ') ?? body.prompt ?? '';
    return this.buildPromptResult(prompt, undefined, 'tgw-chat');
  }

  buildGenerateResponse(body: { prompt?: string }) {
    return this.buildPromptResult(body.prompt ?? '', undefined, 'tgw-generate');
  }

  getCurrentModel() {
    return { result: this.getPrimaryModelName() };
  }
}