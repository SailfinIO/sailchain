// src/modules/blockchain/dto/block.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { TransactionDto } from './transaction.dto';

export class BlockDto {
  @ApiProperty({ description: 'The block index', example: 1 })
  index: number;

  @ApiProperty({
    description: 'Timestamp when the block was created',
    example: 1610000000000,
  })
  timestamp: number;

  @ApiProperty({
    description: 'List of transactions stored in the block',
    type: [TransactionDto],
  })
  data: TransactionDto[];

  @ApiProperty({
    description: 'Hash of the previous block',
    example: '0000abc123',
  })
  previousHash: string;

  @ApiProperty({
    description: 'Hash of the current block',
    example: '0000def456',
  })
  hash: string;
}
