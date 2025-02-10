// src/modules/blockchain/mining.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BlockchainService } from './blockchain.service';
import { TransactionPoolService } from './transaction-pool.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class MiningScheduler {
  private readonly logger = new Logger(MiningScheduler.name);
  // Retrieve the miner address from environment variables.
  // This check ensures that a valid miner address is provided.
  private readonly minerAddress: string;

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly transactionPoolService: TransactionPoolService,
    private readonly configService: ConfigService,
  ) {
    this.minerAddress = this.configService.appConfig.minerAddress || undefined;
  }

  // This cron job runs every 30 seconds.
  @Cron('*/30 * * * * *')
  async handleMining() {
    // Check if a miner address is configured
    if (!this.minerAddress) {
      this.logger.warn('No miner address configured. Skipping mining process.');
      return;
    }

    // Check for pending transactions
    const pendingTx = this.transactionPoolService.getPendingTransactions();
    if (pendingTx.length > 0) {
      this.logger.log(
        'Pending transactions detected, starting mining process...',
      );
      try {
        await this.blockchainService.minePendingTransactions(this.minerAddress);
        this.logger.log('Mining process completed successfully.');
      } catch (error) {
        this.logger.error('Error during mining process', error);
      }
    } else {
      this.logger.log('No pending transactions found, skipping mining.');
    }
  }
}
