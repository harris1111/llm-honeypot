import { Injectable } from '@nestjs/common';

import { RuntimeStateService } from '../../runtime/runtime-state.service';
import { OpenAiCompatibleService } from '../openai-compatible/openai-compatible.service';

@Injectable()
export class OpenAiService extends OpenAiCompatibleService {
  protected readonly serviceName = 'openai' as const;

  constructor(runtimeStateService: RuntimeStateService) {
    super(runtimeStateService);
  }
}