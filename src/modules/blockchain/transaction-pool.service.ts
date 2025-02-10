// src/modules/blockchain/transaction-pool.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from './Transaction';

@Injectable()
export class TransactionPoolService {
  private readonly logger = new Logger(TransactionPoolService.name);
  private pendingTransactions: Transaction[] = [];

  addTransaction(tx: Transaction): void {
    this.pendingTransactions.push(tx);
    this.logger.log(`Transaction added to pool: ${JSON.stringify(tx)}`);
  }

  getPendingTransactions(): Transaction[] {
    return [...this.pendingTransactions];
  }

  clearTransactions(transactions: Transaction[]): void {
    this.pendingTransactions = this.pendingTransactions.filter(
      (tx) => !transactions.includes(tx),
    );
  }
}
