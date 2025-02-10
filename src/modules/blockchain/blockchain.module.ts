// src/modules/blockchain/blockchain.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';
import { NodesModule } from '../nodes/nodes.module';
import { TransactionPoolService } from './transaction-pool.service';
import { TransactionsController } from './transactions.controller';
import { ConsensusService } from './consensus.service';
import { WalletModule } from '../wallet/wallet.module';
import { BlockSchema } from './schemas/block.schema';
import { TransactionSchema } from './schemas/transaction.schema';
import { TransactionService } from './transaction.service';
import { P2PService } from '../p2p/p2p.service';
import { ConsensusScheduler } from './consensus.scheduler';
import { ConfigModule } from '../config/config.module';
import { MiningScheduler } from './mining.scheduler';

@Module({
  imports: [
    NodesModule,
    ConfigModule,
    HttpModule,
    forwardRef(() => WalletModule),
    MongooseModule.forFeature([{ name: 'Block', schema: BlockSchema }]),
    MongooseModule.forFeature([
      { name: 'Transaction', schema: TransactionSchema },
    ]),
  ],
  controllers: [BlockchainController, TransactionsController],
  providers: [
    BlockchainService,
    TransactionPoolService,
    ConsensusService,
    TransactionService,
    P2PService,
    ConsensusScheduler,
    MiningScheduler,
  ],
  exports: [BlockchainService, TransactionPoolService, ConsensusService],
})
export class BlockChainModule {}
