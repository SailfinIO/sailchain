// src/modules/blockchain/classes/BlockChain.ts

import { Logger } from '@nestjs/common';
import { Block } from './Block';

import { Transaction } from './Transaction';

export class Blockchain<T extends Transaction[]> {
  private readonly logger = new Logger(Blockchain.name);
  public chain: Block<T>[];
  public difficulty: number;

  /**
   * Initializes the blockchain with a genesis block.
   * @param difficulty The number of leading zeros required for mining (default is 2).
   */
  constructor(difficulty = 2) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty;
  }

  /**
   * Creates the genesis (first) block in the blockchain.
   */
  private createGenesisBlock(): Block<T> {
    // If T extends Transaction[], then initialize with an empty array.
    return new Block<T>(0, Date.now(), [] as T, '0');
  }
  /**
   * Returns the latest block in the chain.
   */
  public getLatestBlock(): Block<T> {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Adds a new block to the chain after setting its previous hash and mining it.
   * @param newBlock The block to be added.
   */
  public async addBlock(newBlock: Block<T>): Promise<void> {
    newBlock.previousHash = this.getLatestBlock().hash;
    await newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
  }

  /**
   * Validates the integrity of the blockchain.
   * @returns True if the chain is valid, false otherwise.
   */
  public isChainValid(): boolean {
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
