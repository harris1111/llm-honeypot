import { captureBatchRequestSchema } from '@llmtrap/shared';
import { Body, Controller, ForbiddenException, Headers, Inject, Post } from '@nestjs/common';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CaptureService } from './capture.service';

@Controller('capture')
export class CaptureController {
  private readonly captureService: CaptureService;

  constructor(@Inject(CaptureService) captureService: CaptureService) {
    this.captureService = captureService;
  }

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