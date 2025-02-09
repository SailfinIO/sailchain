// src/modules/blockchain/blockchain.service.ts

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

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private blockchain: Blockchain<Transaction[]>;
  private coinbaseReward = 50;

  constructor(
    private readonly nodesService: NodesService,
    private readonly httpService: HttpService,
    private readonly transactionPoolService: TransactionPoolService,
    private readonly p2pService: P2PService,
    @InjectModel('Block') private readonly blockModel: Model<BlockDocument>,
  ) {
    // Create a new blockchain instance
    this.blockchain = new Blockchain<Transaction[]>(2);
  }

  async onModuleInit() {
    // On startup, load the chain from the database.
    const persistedBlocks = await this.blockModel
      .find()
      .sort({ index: 1 })
      .exec();
    if (persistedBlocks.length) {
      this.blockchain.chain = persistedBlocks.map((doc) => {
        // Here you might need to re-instantiate your Block class from document data
        // For simplicity, we assume the structure is compatible.
        return new Block<Transaction[]>(
          doc.index,
          doc.timestamp,
          doc.transactions,
          doc.previousHash,
        );
      });
      this.logger.log('Loaded blockchain from persistent storage.');
    } else {
      // No blocks in DB; save the genesis block.
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
   * Adds a new block and broadcasts it to all known nodes.
   */
  async addBlock(transactions: Transaction[]): Promise<Block<Transaction[]>> {
    const newBlock = new Block<Transaction[]>(
      this.blockchain.chain.length,
      Date.now(),
      transactions,
      this.blockchain.getLatestBlock().hash,
    );
    await this.blockchain.addBlock(newBlock);

    // Persist the new block
    await new this.blockModel(newBlock).save();
    this.logger.log(`Block added and persisted: ${newBlock.hash}`);

    this.p2pService.broadcastBlock(newBlock);

    // Broadcast new block to known nodes, etc.
    const nodes = this.nodesService.getNodes();
    for (const nodeUrl of nodes) {
      try {
        const observable = this.httpService.post(`${nodeUrl}/blocks/receive`, {
          block: newBlock,
        });
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
    return this.blockchain.isChainValid();
  }

  /**
   * Validates a given chain.
   * @param chain The chain to validate.
   */
  private validateChain(chain: Block<Transaction[]>[]): boolean {
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      // Recalculate the hash using the transactions array as data.
      const recalculatedHash = new Block<Transaction[]>(
        currentBlock.index,
        currentBlock.timestamp,
        currentBlock.transactions,
        currentBlock.previousHash,
      ).calculateHash();

      if (currentBlock.hash !== recalculatedHash) {
        this.logger.error(`Block ${i} has an invalid hash.`);
        return false;
      }
      if (currentBlock.previousHash !== previousBlock.hash) {
        this.logger.error(`Block ${i} has an invalid previous hash.`);
        return false;
      }
    }
    return true;
  }

  async receiveBlock(
    blockDto: BlockDto,
  ): Promise<{ success: boolean; message?: string }> {
    const latestBlock = this.blockchain.getLatestBlock();

    if (blockDto.index !== latestBlock.index + 1) {
      this.logger.error('Received block index is not sequential.');
      return { success: false, message: 'Block index is not sequential.' };
    }

    if (blockDto.previousHash !== latestBlock.hash) {
      this.logger.error('Received block previous hash does not match.');
      return { success: false, message: 'Previous hash mismatch.' };
    }

    const transactions = blockDto.data.map(
      (txDto) => new Transaction(txDto.sender, txDto.recipient, txDto.amount),
    );
    const recalculatedHash = new Block<Transaction[]>(
      blockDto.index,
      blockDto.timestamp,
      transactions,
      blockDto.previousHash,
    ).calculateHash();

    if (recalculatedHash !== blockDto.hash) {
      this.logger.error('Invalid block hash.');
      return { success: false, message: 'Invalid block hash.' };
    }

    // If validations pass, add the block to your chain.
    this.blockchain.chain.push(
      new Block<Transaction[]>(
        blockDto.index,
        blockDto.timestamp,
        transactions,
        blockDto.previousHash,
      ),
    );

    this.logger.log(`Block received and added: ${blockDto.hash}`);
    return { success: true };
  }

  /**
   * Attempts to replace the local chain with a new chain if it is valid and longer.
   * @param newChain The new chain to consider.
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
   * Mine all pending transactions. A coinbase reward is added automatically.
   */
  async minePendingTransactions(
    minerAddress: string,
  ): Promise<Block<Transaction[]>> {
    // Create a coinbase transaction.
    const coinbaseTx = new Transaction(
      'SYSTEM',
      minerAddress,
      this.coinbaseReward,
    );
    // Get pending transactions from the pool.
    const pendingTx = this.transactionPoolService.getPendingTransactions();
    // Prepend the coinbase reward.
    const blockTransactions = [coinbaseTx, ...pendingTx];

    const newBlock = new Block<Transaction[]>(
      this.blockchain.chain.length,
      Date.now(),
      blockTransactions,
      this.blockchain.getLatestBlock().hash,
    );
    await this.blockchain.addBlock(newBlock);
    this.logger.log(`Block mined: ${newBlock.hash}`);
    // Clear the transactions that have been mined.
    this.transactionPoolService.clearTransactions(pendingTx);

    // Broadcast the new block to registered nodes.
    const nodes = this.nodesService.getNodes();
    for (const nodeUrl of nodes) {
      try {
        // Note: Use the same endpoint your peer nodes expose.
        const observable = this.httpService.post(
          `${nodeUrl}/blockchain/receive`,
          newBlock,
        );
        await firstValueFrom(observable);
      } catch (error) {
        this.logger.error(`Failed to broadcast to node ${nodeUrl}`, error);
      }
    }
    return newBlock;
  }
}
