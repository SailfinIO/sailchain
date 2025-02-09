// src/modules/blockchain/classes/Block.ts

import { Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { Transaction } from './Transaction';

export class Block<T> {
  private readonly logger = new Logger(Block.name);
  public readonly index: number;
  public readonly timestamp: number;
  public readonly transactions: Transaction[];
  public previousHash: string;
  public hash: string;
  private nonce: number;

  constructor(
    index: number,
    timestamp: number,
    transactions: Transaction[],
    previousHash: string = '',
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  /**
   * Generates a SHA-256 hash of the block's contents.
   */
  calculateHash(): string {
    // Incorporate transactions into the hash calculation
    const dataToHash = `${this.index}|${this.previousHash}|${this.timestamp}|${JSON.stringify(this.transactions)}|${this.nonce}`;
    return createHash('sha256').update(dataToHash).digest('hex');
  }

  /**
   * Mines the block by finding a hash that starts with a given number of zeros.
   * @param difficulty The number of leading zeros required in the hash.
   */
  mineBlock(difficulty: number): Promise<void> {
    const targetPrefix = '0'.repeat(difficulty);
    return new Promise((resolve) => {
      const iterate = () => {
        if (this.hash.startsWith(targetPrefix)) {
          this.logger.log(`Block mined: ${this.hash}`);
          return resolve();
        }
        this.nonce++;
        this.hash = this.calculateHash();
        // Yield every 1000 iterations to avoid blocking the event loop
        if (this.nonce % 1000 === 0) {
          setImmediate(iterate);
        } else {
          iterate();
        }
      };
      iterate();
    });
  }
}
