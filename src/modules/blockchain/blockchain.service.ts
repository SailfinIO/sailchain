import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Blockchain } from './classes/Blockchain';
import { Block } from './classes/Block';
import { NodesService } from '../nodes/nodes.service';
import { BlockDto } from './dto/block.dto';
import { Transaction } from './classes/Transaction';
import { TransactionPoolService } from './transaction-pool.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlockDocument } from './schemas/block.schema';
import { P2PService } from '../p2p/p2p.service';
import { WalletService } from '../wallet/wallet.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly initialCoinbaseReward: number = 50;
  private readonly blockRewardHalvingInterval: number = 210000;
  private readonly maxCoins: number = 21000000;
  private readonly difficultyAdjustmentInterval: number = 10;
  private readonly targetBlockTime: number = 60000;
  private blockchain: Blockchain<Transaction[]>;

  constructor(
    private readonly nodesService: NodesService,
    private readonly httpService: HttpService,
    private readonly transactionPoolService: TransactionPoolService,
    private readonly p2pService: P2PService,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
    @InjectModel('Block') private readonly blockModel: Model<BlockDocument>,
  ) {
    const genesisWalletAddress =
      this.configService.appConfig.genesisWalletAddress;
    const initialCoinbaseReward =
      this.configService.appConfig.initialCoinbaseReward || 50;

    this.initialCoinbaseReward = initialCoinbaseReward;

    this.blockchain = new Blockchain<Transaction[]>(
      genesisWalletAddress,
      initialCoinbaseReward,
      2,
    );
  }
  async onModuleInit() {
    // Load the blockchain from persistent storage if available.
    const persistedBlocks = await this.blockModel
      .find()
      .sort({ index: 1 })
      .exec();
    if (persistedBlocks.length) {
      this.blockchain.chain = persistedBlocks.map((doc) => {
        // Convert each transaction plain object into a Transaction instance.
        const transactions = doc.transactions.map(
          (tx: any) => new Transaction(tx.sender, tx.recipient, tx.amount),
        );

        return new Block<Transaction[]>(
          doc.index,
          doc.timestamp,
          transactions,
          doc.previousHash,
          doc.difficulty,
        );
      });
      this.logger.log('Loaded blockchain from persistent storage.');
    } else {
      // No blocks in DB; create and persist the genesis block.
      await new this.blockModel(this.blockchain.chain[0]).save();
      this.logger.log('Created genesis block in persistent storage.');
    }
  }

  /**
   * Returns the full blockchain.
   */
  getChain(): Block<any>[] {
    return this.blockchain.chain;
  }

  /**
   * Returns the latest block in the blockchain.
   */
  getLatestBlock(): Block<any> {
    return this.blockchain.getLatestBlock();
  }

  /**
   * Adds a new block with the given transactions, persists it,
   * and broadcasts it to all known nodes.
   */
  public async addBlock(
    transactions: Transaction[],
  ): Promise<Block<Transaction[]>> {
    const newBlock = new Block<Transaction[]>(
      this.blockchain.chain.length,
      Date.now(),
      transactions,
      this.blockchain.getLatestBlock().hash,
      this.blockchain.difficulty,
    );

    // Adjust the blockchain difficulty only every 'difficultyAdjustmentInterval' blocks.
    this.blockchain.difficulty = this.adjustDifficulty();
    newBlock.difficulty = this.blockchain.difficulty;

    // Mine the block using the updated difficulty.
    await this.blockchain.addBlock(newBlock);

    // Persist the new block.
    await new this.blockModel(newBlock).save();
    this.logger.log(`Block added and persisted: ${newBlock.hash}`);

    // Broadcast the new block via P2P and HTTP.
    this.p2pService.broadcastBlock(newBlock);
    const nodes = this.nodesService.getNodes();
    for (const nodeUrl of nodes) {
      try {
        const observable = this.httpService.post(
          `${nodeUrl}/blockchain/receive`,
          { block: newBlock },
        );
        await firstValueFrom(observable);
      } catch (error) {
        this.logger.error(`Failed to broadcast to node ${nodeUrl}`, error);
      }
    }
    return newBlock;
  }

  public isChainValid(chain?: Block<any>[]): boolean {
    if (chain) {
      return this.validateChain(chain);
    }
    return this.blockchain.isValid();
  }

  /**
   * Validates a given chain.
   */
  private validateChain(chain: Block<Transaction[]>[]): boolean {
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      if (!currentBlock.isValid()) {
        this.logger.error(
          `Block ${currentBlock.index} failed its internal validity check.`,
        );
        return false;
      }
      if (currentBlock.previousHash !== previousBlock.hash) {
        this.logger.error(
          `Block ${currentBlock.index} has an invalid previous hash.`,
        );
        return false;
      }
    }
    return true;
  }

  async receiveBlock(
    blockDto: BlockDto,
  ): Promise<{ success: boolean; message?: string }> {
    const transactions = blockDto.data.map(
      (txDto) => new Transaction(txDto.sender, txDto.recipient, txDto.amount),
    );
    const receivedBlock = new Block<Transaction[]>(
      blockDto.index,
      blockDto.timestamp,
      transactions,
      blockDto.previousHash,
      blockDto.difficulty,
    );

    // Validate the block before adding it to the chain
    if (!receivedBlock.isValid()) {
      this.logger.error(`Received block ${blockDto.index} failed validation.`);
      return { success: false, message: 'Invalid block.' };
    }

    // Additional checks like index sequencing and previous hash matching can follow here
    this.blockchain.chain.push(receivedBlock);
    this.logger.log(`Block received and added: ${blockDto.hash}`);
    return { success: true };
  }

  /**
   * Attempts to replace the local chain with a new chain if it is valid and longer.
   */
  async replaceChain(newChain: Block<any>[]): Promise<boolean> {
    if (newChain.length <= this.blockchain.chain.length) {
      this.logger.warn('Received chain is not longer than the current chain.');
      return false;
    }
    if (!this.validateChain(newChain)) {
      this.logger.error('Received chain is invalid.');
      return false;
    }
    this.blockchain.chain = newChain;
    this.logger.log('Local blockchain replaced with received chain.');
    return true;
  }

  /**
   * Mines all pending transactions. A coinbase reward is added automatically.
   */
  async minePendingTransactions(
    minerAddress: string,
  ): Promise<Block<Transaction[]>> {
    // Determine the current block height.
    const currentBlockHeight = this.blockchain.chain.length;
    // Calculate the coinbase reward based on the block height (halving every blockRewardHalvingInterval blocks).
    let reward = this.getBlockReward(currentBlockHeight);

    // Ensure that total coins never exceed maxCoins.
    const totalCoinsMinted = this.calculateTotalCoins();
    if (totalCoinsMinted + reward > this.maxCoins) {
      reward = Math.max(0, this.maxCoins - totalCoinsMinted);
    }

    const coinbaseTx = new Transaction('SYSTEM', minerAddress, reward);

    // Retrieve pending transactions and filter valid ones.
    const pendingTx = this.transactionPoolService.getPendingTransactions();
    const validTransactions: Transaction[] = [];
    for (const tx of pendingTx) {
      try {
        // Skip non-coinbase transactions if invalid or if insufficient funds.
        if (
          tx.sender !== 'SYSTEM' &&
          (!tx.isValid() ||
            this.walletService.getBalance(tx.sender) < tx.amount)
        ) {
          continue;
        }
        validTransactions.push(tx);
      } catch (error) {
        this.logger.warn(`Transaction validation failed: ${error.message}`);
        continue;
      }
    }

    // Combine coinbase and valid pending transactions.
    const blockTransactions = [coinbaseTx, ...validTransactions];

    // Mine the new block.
    const newBlock = await this.addBlock(blockTransactions);

    // Clear processed transactions from the pool.
    this.transactionPoolService.clearTransactions(validTransactions);

    return newBlock;
  }

  /**
   * Adjusts the blockchain difficulty based on the average block time over the last interval.
   * Only adjusts every 'difficultyAdjustmentInterval' blocks.
   */
  private adjustDifficulty(): number {
    const chain = this.blockchain.chain;
    if (chain.length < this.difficultyAdjustmentInterval + 1) {
      return this.blockchain.difficulty;
    }
    if ((chain.length - 1) % this.difficultyAdjustmentInterval !== 0) {
      return this.blockchain.difficulty;
    }

    const startIndex = chain.length - 1 - this.difficultyAdjustmentInterval;
    const timeTaken =
      chain[chain.length - 1].timestamp - chain[startIndex].timestamp;
    const expectedTime =
      this.targetBlockTime * this.difficultyAdjustmentInterval;

    let newDifficulty = this.blockchain.difficulty;
    // Using a ratio to adjust
    const adjustmentFactor = expectedTime / timeTaken;
    if (adjustmentFactor > 1.1) {
      newDifficulty++;
      this.logger.log(`Increasing difficulty to ${newDifficulty}`);
    } else if (adjustmentFactor < 0.9 && newDifficulty > 1) {
      newDifficulty--;
      this.logger.log(`Decreasing difficulty to ${newDifficulty}`);
    } else {
      this.logger.log(`Difficulty remains at ${newDifficulty}`);
    }
    return newDifficulty;
  }

  /**
   * Calculates the coinbase reward based on the current block height.
   * The reward halves every 'blockRewardHalvingInterval' blocks.
   */
  private getBlockReward(blockHeight: number): number {
    const halvingCount = Math.floor(
      blockHeight / this.blockRewardHalvingInterval,
    );
    return Math.floor(this.initialCoinbaseReward / Math.pow(2, halvingCount));
  }

  /**
   * Calculates the total coins minted so far by summing coinbase transactions.
   */
  private calculateTotalCoins(): number {
    return this.blockchain.chain.reduce((total, block) => {
      // Assume that the coinbase transaction is the first transaction in the block.
      const coinbaseTx = block.transactions.find(
        (tx) => tx.sender === 'SYSTEM',
      );
      return total + (coinbaseTx ? coinbaseTx.amount : 0);
    }, 0);
  }
}
