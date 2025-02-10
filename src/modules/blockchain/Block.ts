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
  public difficulty: number;

  constructor(
    index: number,
    timestamp: number,
    transactions: Transaction[],
    previousHash: string = '',
    difficulty: number,
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  private computeMerkleRoot(transactions: Transaction[]): string {
    if (transactions.length === 0) return '';
    let hashes = transactions.map((tx) => tx.calculateHash());
    while (hashes.length > 1) {
      const temp: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = i + 1 < hashes.length ? hashes[i + 1] : left;
        const combinedHash = createHash('sha256')
          .update(left + right)
          .digest('hex');
        temp.push(combinedHash);
      }
      hashes = temp;
    }
    return hashes[0];
  }

  /**
   * Generates a SHA-256 hash of the block's contents.
   */
  calculateHash(): string {
    const merkleRoot = this.computeMerkleRoot(this.transactions);
    const dataToHash = `${this.index}|${this.previousHash}|${this.timestamp}|${merkleRoot}|${this.nonce}|${this.difficulty}`;
    return createHash('sha256').update(dataToHash).digest('hex');
  }

  public isValid(): boolean {
    // Check if the stored hash matches the recalculated hash
    if (this.hash !== this.calculateHash()) {
      return false;
    }
    // Validate each transaction (ignoring coinbase transactions)
    for (const tx of this.transactions) {
      if (tx.sender !== 'SYSTEM' && !tx.isValid()) {
        return false;
      }
    }
    return true;
  }

  /**
   * Mines the block by finding a hash that starts with a given number of zeros.
   * @param difficulty The number of leading zeros required in the hash.
   */
  public mineBlock(difficulty: number): Promise<void> {
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
