// src/modules/nodes/dto/create-node.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class CreateNodeDto {
  @ApiProperty({
    description: 'The URL of the node (e.g., http://localhost:3001)',
    example: 'http://localhost:3001',
  })
  nodeUrl: string;
}
