// src/modules/wallet/wallet.service.ts
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ec } from 'elliptic';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TransactionPoolService } from '../blockchain/transaction-pool.service';

const EC = new ec('secp256k1');

@Injectable()
export class WalletService {
  constructor(
    @Inject(forwardRef(() => BlockchainService))
    private readonly blockchainService: BlockchainService,
    private readonly transactionPoolService: TransactionPoolService,
  ) {}

  generateWallet() {
    const keyPair = EC.genKeyPair();
    const privateKey = keyPair.getPrivate('hex');
    const publicKey = keyPair.getPublic('hex');
    return { privateKey, publicKey };
  }

  getBalance(address: string): number {
    let balance = 0;
    // Scan the confirmed blocks in the blockchain
    this.blockchainService.getChain().forEach((block) => {
      block.transactions.forEach((tx) => {
        if (tx.recipient === address) {
          balance += tx.amount;
        }
        if (tx.sender === address) {
          balance -= tx.amount;
        }
      });
    });
    // Include pending transactions from the pool
    this.transactionPoolService.getPendingTransactions().forEach((tx) => {
      if (tx.recipient === address) {
        balance += tx.amount;
      }
      if (tx.sender === address) {
        balance -= tx.amount;
      }
    });

    return balance;
  }
}
