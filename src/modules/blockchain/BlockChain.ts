import { Logger } from '@nestjs/common';
import { Block } from './Block';
import { Transaction } from './Transaction';

export class Blockchain<T extends Transaction[]> {
  private readonly logger = new Logger(Blockchain.name);
  public chain: Block<T>[];
  public difficulty: number;

  /**
   * Initializes the blockchain with a genesis block.
   * @param genesisWalletAddress The address to receive the coinbase reward.
   * @param initialReward The coinbase reward to seed the genesis block.
   * @param difficulty The number of leading zeros required for mining.
   */
  constructor(
    genesisWalletAddress: string,
    initialCoinbaseReward: number,
    difficulty = 2,
  ) {
    this.chain = [
      this.createGenesisBlock(
        genesisWalletAddress,
        initialCoinbaseReward,
        difficulty,
      ),
    ];
    this.difficulty = difficulty;
  }

  /**
   * Creates the genesis block. Here, we include a coinbase transaction to seed the network.
   */
  private createGenesisBlock(
    genesisWalletAddress: string,
    initialReward: number,
    difficulty: number,
  ): Block<T> {
    const coinbaseTx = new Transaction(
      'SYSTEM',
      genesisWalletAddress,
      initialReward,
    );
    const transactions: Transaction[] = [coinbaseTx];
    return new Block<T>(
      0, // index
      Date.now(), // timestamp
      transactions,
      '0', // previous hash
      difficulty,
    );
  }

  public getLatestBlock(): Block<T> {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Mines and adds a new block to the chain.
   */
  public async addBlock(newBlock: Block<T>): Promise<void> {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.difficulty = this.difficulty;
    await newBlock.mineBlock(newBlock.difficulty);
    this.chain.push(newBlock);
  }

  /**
   * Validates the blockchain’s integrity.
   */
  public isValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
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
}
