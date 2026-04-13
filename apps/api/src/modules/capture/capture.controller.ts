import { captureBatchRequestSchema } from '@llmtrap/shared';
import { Body, Controller, ForbiddenException, Headers, Post } from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CaptureService } from './capture.service';

@Controller('capture')
export class CaptureController {
  constructor(private readonly captureService: CaptureService) {}

  @Post('batch')
  ingestBatch(
    @Headers('x-node-key') nodeKey: string | undefined,
    @Body(new ZodValidationPipe(captureBatchRequestSchema)) body: typeof captureBatchRequestSchema['_type'],
  ) {
    if (!nodeKey) {
      throw new ForbiddenException('Missing x-node-key header');
    }

    return this.captureService.ingestBatch(nodeKey, body);
  }
}