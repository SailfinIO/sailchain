// src/modules/blockchain/mining.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BlockchainService } from './blockchain.service';
import { TransactionPoolService } from './transaction-pool.service';

@Injectable()
export class MiningScheduler {
  private readonly logger = new Logger(MiningScheduler.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly transactionPoolService: TransactionPoolService,
  ) {}

  // This cron job runs every 30 seconds.
  @Cron('*/30 * * * * *')
  async handleMining() {
    const pendingTx = this.transactionPoolService.getPendingTransactions();
    if (pendingTx.length > 0) {
      this.logger.log(
        'Pending transactions detected, starting mining process...',
      );
      try {
        // Replace 'MINER_ADDRESS' with the actual miner’s wallet address
        await this.blockchainService.minePendingTransactions('MINER_ADDRESS');
        this.logger.log('Mining process completed successfully.');
      } catch (error) {
        this.logger.error('Error during mining process', error);
      }
    } else {
      this.logger.log('No pending transactions found, skipping mining.');
    }
  }
}
