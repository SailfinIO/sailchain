// src/modules/blockchain/classes/Transaction.ts

import { createHash } from 'crypto';
import { ec, KeyPair } from 'elliptic';

const EC = new ec('secp256k1');

export class Transaction {
  public signature?: string;

  constructor(
    public sender: string, // public key as a hex string
    public recipient: string,
    public amount: number,
  ) {}

  calculateHash(): string {
    return createHash('sha256')
      .update(this.sender + this.recipient + this.amount)
      .digest('hex');
  }

  signTransaction(signingKey: KeyPair): void {
    // Make sure the public key matches the sender address
    if (signingKey.getPublic('hex') !== this.sender) {
      throw new Error('You cannot sign transactions for other wallets!');
    }
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');
    this.signature = sig.toDER('hex');
  }

  isValid(): boolean {
    // For coinbase transactions, no signature is required.
    if (this.sender === 'SYSTEM') return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction');
    }

    const publicKey = EC.keyFromPublic(this.sender, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}
