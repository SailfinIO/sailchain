// src/modules/nodes/dto/node.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class NodeDto {
  @ApiProperty({
    description: 'The URL of the registered node',
    example: 'http://localhost:3001',
  })
  nodeUrl: string;
}
