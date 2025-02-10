// src/modules/wallet/wallet.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { BlockChainModule } from '../blockchain/blockchain.module'; // Import BlockchainModule
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [forwardRef(() => BlockChainModule), ConfigModule], // Use forwardRef here
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
