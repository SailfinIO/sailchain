// src/modules/blockchain/transactions.controller.ts
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionPoolService } from './transaction-pool.service';
import { Transaction } from './classes/Transaction';
import { TransactionDto } from './dto/transaction.dto';
import { WalletService } from '../wallet/wallet.service';
import { TransactionService } from './transaction.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionPoolService: TransactionPoolService,
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService, // injected here
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction added to pool' })
  async addTransaction(@Body() transactionDto: TransactionDto) {
    // Check balance before adding the transaction
    const balance = this.walletService.getBalance(transactionDto.sender);
    if (balance < transactionDto.amount) {
      throw new BadRequestException('Insufficient funds');
    }

    // In a full implementation, verify the transaction signature here.
    const tx = new Transaction(
      transactionDto.sender,
      transactionDto.recipient,
      transactionDto.amount,
    );

    // Add to the in-memory pool
    this.transactionPoolService.addTransaction(tx);

    // Persist the transaction to MongoDB
    await this.transactionService.createTransaction(tx);

    return { message: 'Transaction added to pool' };
  }
}
