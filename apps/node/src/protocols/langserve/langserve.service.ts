import { Injectable } from '@nestjs/common';

import { RuntimeStateService } from '../../runtime/runtime-state.service';
import { TemplateProtocolService } from '../template-protocol/template-protocol.service';

@Injectable()
export class LangserveService extends TemplateProtocolService {
  protected readonly serviceName = 'langserve' as const;

  constructor(runtimeStateService: RuntimeStateService) {
    super(runtimeStateService);
  }

  buildBatchResponse(body: unknown[]) {
    return body.map((entry, index) => {
      const result = this.buildInvokeResponse(entry);

      return {
        index,
        output: { answer: result.content },
      };
    });
  }

  buildInvokeResponse(body: unknown) {
    return this.buildPromptResult(this.extractPrompt(body), undefined, 'langserve');
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