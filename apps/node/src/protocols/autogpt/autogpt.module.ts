import { Module } from '@nestjs/common';

import { NodeSharedModule } from '../../node-shared.module';
import { AutogptController } from './autogpt.controller';
import { AutogptService } from './autogpt.service';

@Module({
  controllers: [AutogptController],
  imports: [NodeSharedModule],
  providers: [AutogptService],
})
export class AutogptModule {}