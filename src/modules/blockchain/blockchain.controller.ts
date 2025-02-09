// src/modules/blockchain/blockchain.controller.ts

import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { BlockDto } from './dto/block.dto';
import { Transaction } from './classes/Transaction';

@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  /**
   * Retrieve the full blockchain.
   */
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

  @Post()
  @ApiOperation({ summary: 'Add a new block to the blockchain' })
  @ApiResponse({
    status: 201,
    description: 'The new block that was added',
    type: BlockDto,
  })
  addBlock(@Body() createBlockDto: CreateBlockDto) {
    // Convert TransactionDto[] to Transaction[]
    const transactions = createBlockDto.data.map(
      (txDto) => new Transaction(txDto.sender, txDto.recipient, txDto.amount),
    );
    return this.blockchainService.addBlock(transactions);
  }

  /**
   * Validate the blockchain integrity.
   */
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
   * Endpoint to receive a new block from a peer node.
   */
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
