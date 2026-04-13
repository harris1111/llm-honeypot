import { Injectable } from '@nestjs/common';

import { RuntimeStateService } from '../../runtime/runtime-state.service';
import { OpenAiCompatibleService } from '../openai-compatible/openai-compatible.service';

@Injectable()
export class LlamacppService extends OpenAiCompatibleService {
  protected readonly serviceName = 'llamacpp' as const;

  constructor(runtimeStateService: RuntimeStateService) {
    super(runtimeStateService);
  }

  listSlots() {
    const primaryModel = this.resolveModels()[0];

    return {
      slots: [
        {
          generation_tokens: 0,
          id: 0,
          model: primaryModel.name,
          n_ctx: 8192,
          prompt_tokens: 0,
          state: 'idle',
        },
      ],
    };
  }
}