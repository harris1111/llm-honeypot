import { Injectable } from '@nestjs/common';

import { RuntimeStateService } from '../../runtime/runtime-state.service';
import { TemplateProtocolService } from '../template-protocol/template-protocol.service';

@Injectable()
export class LangserveService extends TemplateProtocolService {
  protected readonly serviceName = 'langserve' as const;

  constructor(runtimeStateService: RuntimeStateService) {
    super(runtimeStateService);
  }

  async buildBatchResponse(body: unknown[], sourceIp?: string) {
    const results = await Promise.all(body.map((entry) => this.buildInvokeResponse(entry, sourceIp)));
    const strategy: 'real_model' | 'static' | 'template' = results.some((result) => result.strategy === 'real_model')
      ? 'real_model'
      : results.some((result) => result.strategy === 'template')
        ? 'template'
        : 'static';

    return {
      payload: results.map((result, index) => ({
        index,
        output: { answer: result.content },
      })),
      strategy,
    };
  }

  async buildInvokeResponse(body: unknown, sourceIp?: string) {
    return this.buildPromptResult(this.extractPrompt(body), undefined, 'langserve', sourceIp);
  }

  getInputSchema() {
    return {
      properties: {
        input: {
          properties: {
            question: { type: 'string' },
          },
          type: 'object',
        },
      },
      required: ['input'],
      title: 'LangServeInput',
      type: 'object',
    };
  }

  getOutputSchema() {
    return {
      properties: {
        output: {
          properties: {
            answer: { type: 'string' },
          },
          type: 'object',
        },
      },
      required: ['output'],
      title: 'LangServeOutput',
      type: 'object',
    };
  }

  private extractPrompt(body: unknown): string {
    if (typeof body === 'string') {
      return body;
    }

    if (body && typeof body === 'object') {
      const input = (body as { input?: { question?: string }; question?: string }).input;
      if (input?.question) {
        return input.question;
      }

      if ('question' in body && typeof (body as { question?: string }).question === 'string') {
        return (body as { question: string }).question;
      }
    }

    return '';
  }
}