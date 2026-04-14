import { Injectable } from '@nestjs/common';

import { RuntimeStateService } from '../../runtime/runtime-state.service';
import { TemplateProtocolService } from '../template-protocol/template-protocol.service';

@Injectable()
export class TextGenerationWebuiService extends TemplateProtocolService {
  protected readonly serviceName = 'text-generation-webui' as const;

  constructor(runtimeStateService: RuntimeStateService) {
    super(runtimeStateService);
  }

  async buildChatResponse(body: { messages?: Array<{ content?: string }>; prompt?: string }, sourceIp?: string) {
    const prompt = body.messages?.map((message) => message.content ?? '').join(' ') ?? body.prompt ?? '';
    return this.buildPromptResult(prompt, undefined, 'tgw-chat', sourceIp);
  }

  async buildGenerateResponse(body: { prompt?: string }, sourceIp?: string) {
    return this.buildPromptResult(body.prompt ?? '', undefined, 'tgw-generate', sourceIp);
  }

  getCurrentModel() {
    return { result: this.getPrimaryModelName() };
  }
}