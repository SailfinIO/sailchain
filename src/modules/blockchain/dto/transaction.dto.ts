// src/modules/blockchain/dto/transaction.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class TransactionDto {
  @ApiProperty({
    description:
      'The address of the sender. Use "SYSTEM" for coinbase transactions.',
    example: 'SYSTEM',
  })
  sender: string;

  @ApiProperty({
    description: 'The address of the recipient.',
    example: '0x123456789abcdef',
  })
  recipient: string;

  @ApiProperty({
    description: 'The amount being transferred.',
    example: 10,
  })
  amount: number;
}
