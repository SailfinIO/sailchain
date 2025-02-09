// src/modules/wallet/wallet.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { BlockChainModule } from '../blockchain/blockchain.module'; // Import BlockchainModule

@Module({
  imports: [forwardRef(() => BlockChainModule)], // Use forwardRef here
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
