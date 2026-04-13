import { Injectable } from '@nestjs/common';

import { RuntimeStateService } from '../../runtime/runtime-state.service';
import { OpenAiCompatibleService } from '../openai-compatible/openai-compatible.service';

@Injectable()
export class LmStudioService extends OpenAiCompatibleService {
  protected readonly serviceName = 'lm-studio' as const;

  constructor(runtimeStateService: RuntimeStateService) {
    super(runtimeStateService);
  }
}