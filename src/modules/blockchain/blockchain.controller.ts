// src/modules/blockchain/blockchain.controller.ts

import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { BlockDto } from './dto/block.dto';
import { Transaction } from './classes/Transaction';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  /**
   * Retrieve the full blockchain.
   * Allow up to 20 requests per minute.
   */
  @Throttle({
    default: { limit: 20, ttl: 60 },
  })
  @Get()
  @ApiOperation({ summary: 'Retrieve the full blockchain' })
  @ApiResponse({
    status: 200,
    description: 'An array of blocks',
    type: [BlockDto],
  })
  getChain() {
    return this.blockchainService.getChain();
  }

  /**
   * Retrieve the latest block in the blockchain.
   */
  @Throttle({
    default: { limit: 20, ttl: 60 },
  })
  @Get('latest')
  @ApiOperation({ summary: 'Retrieve the latest block' })
  @ApiResponse({
    status: 200,
    description: 'The latest block',
    type: BlockDto,
  })
  getLatestBlock() {
    return this.blockchainService.getLatestBlock();
  }

  /**
   * Add a new block to the blockchain.
   * Since this modifies state, allow only 5 requests per minute.
   */
  @Throttle({
    default: { limit: 5, ttl: 60 },
  })
  @Post()
  @ApiOperation({ summary: 'Add a new block to the blockchain' })
  @ApiResponse({
    status: 201,
    description: 'The new block that was added',
    type: BlockDto,
  })
  addBlock(@Body() createBlockDto: CreateBlockDto) {
    const transactions = createBlockDto.data.map(
      (txDto) => new Transaction(txDto.sender, txDto.recipient, txDto.amount),
    );
    return this.blockchainService.addBlock(transactions);
  }

  /**
   * Validate the blockchain integrity.
   */
  @Throttle({
    default: { limit: 20, ttl: 60 },
  })
  @Get('validate')
  @ApiOperation({ summary: 'Validate the blockchain integrity' })
  @ApiResponse({
    status: 200,
    description: 'Returns true if the blockchain is valid, false otherwise',
  })
  validateChain() {
    return this.blockchainService.isChainValid();
  }

  /**
   * Receive a new block from a peer node.
   */
  @Throttle({
    default: { limit: 5, ttl: 60 },
  })
  @Post('receive')
  @ApiOperation({ summary: 'Receive a new block from a peer node' })
  @ApiResponse({
    status: 200,
    description: 'Block received and added successfully.',
  })
  receiveBlock(@Body() blockDto: BlockDto) {
    return this.blockchainService.receiveBlock(blockDto);
  }
}
