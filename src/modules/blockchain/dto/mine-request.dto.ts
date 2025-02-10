// src/modules/blockchain/dto/mine-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class MineRequestDto {
  @ApiProperty({
    description: 'The wallet address of the miner (public key)',
    example: '0x123456789abcdef',
  })
  minerAddress: string;
}
