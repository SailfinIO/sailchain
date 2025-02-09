// src/modules/blockchain/mining.controller.ts
import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';

@ApiTags('Mining')
@Controller('mine')
export class MiningController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Post()
  @ApiOperation({ summary: 'Manually trigger mining process' })
  @ApiResponse({
    status: 201,
    description: 'Block mined and added to blockchain',
  })
  async mine() {
    // Replace 'MINER_ADDRESS' with the actual miner's wallet address
    return await this.blockchainService.minePendingTransactions(
      'MINER_ADDRESS',
    );
  }
}
