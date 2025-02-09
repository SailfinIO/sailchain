// src/modules/blockchain/dto/create-block.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { TransactionDto } from './transaction.dto';

export class CreateBlockDto {
  @ApiProperty({
    description: 'List of transactions to be stored in the block',
    type: [TransactionDto],
  })
  data: TransactionDto[];
}
