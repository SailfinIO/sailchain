// src/modules/blockchain/transactions.controller.ts
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionPoolService } from './transaction-pool.service';
import { Transaction } from './Transaction';
import { TransactionDto } from './dto/transaction.dto';
import { WalletService } from '../wallet/wallet.service';
import { TransactionService } from './transaction.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionPoolService: TransactionPoolService,
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Submit a new transaction.
   * Limit to 10 requests per minute.
   */
  @Throttle({
    default: { limit: 10, ttl: 60 },
  })
  @Post()
  @ApiOperation({ summary: 'Submit a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction added to pool' })
  async addTransaction(@Body() transactionDto: TransactionDto) {
    const balance = this.walletService.getBalance(transactionDto.sender);
    if (balance < transactionDto.amount) {
      throw new BadRequestException('Insufficient funds');
    }

    const tx = new Transaction(
      transactionDto.sender,
      transactionDto.recipient,
      transactionDto.amount,
    );

    try {
      if (!tx.isValid()) {
        throw new BadRequestException('Invalid transaction signature');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    this.transactionPoolService.addTransaction(tx);
    await this.transactionService.createTransaction(tx);

    return { message: 'Transaction added to pool' };
  }
}
