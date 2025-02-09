// src/modules/nodes/nodes.module.ts

import { Module } from '@nestjs/common';
import { NodesController } from './nodes.controller';
import { NodesService } from './nodes.service';

@Module({
  imports: [],
  controllers: [NodesController],
  providers: [NodesService],
  exports: [NodesService],
})
export class NodesModule {}
