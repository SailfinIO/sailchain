// src/modules/wallet/wallet.service.ts

import {
  Injectable,
  Inject,
  forwardRef,
  InternalServerErrorException,
} from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { TransactionPoolService } from '../blockchain/transaction-pool.service';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ConfigService } from '../config/config.service';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { BIP32Factory } from 'bip32';
import * as tinysecp from 'tiny-secp256k1';
import { keccak256, toChecksumAddress } from 'ethereumjs-util';
import { Wallet } from '@ethereumjs/wallet';

const bip32 = BIP32Factory(tinysecp);
const IV_LENGTH = 16; // AES block size

@Injectable()
export class WalletService {
  private encryptionKey: string;
  constructor(
    @Inject(forwardRef(() => BlockchainService))
    private readonly blockchainService: BlockchainService,
    private readonly transactionPoolService: TransactionPoolService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.appConfig.encryptionKey;
  }

  /**
   * Generate a new HD wallet using BIP39/BIP32.
   * Returns a mnemonic seed, the full public key, an encrypted private key,
   * and an Ethereum-style address.
   */
  generateWallet(): {
    mnemonic: string;
    publicKey: string;
    encryptedPrivateKey: string;
    address: string;
  } {
    // 1. Generate a mnemonic using BIP39.
    const mnemonic = generateMnemonic();
    // 2. Convert mnemonic to a seed.
    const seed = mnemonicToSeedSync(mnemonic);
    // 3. Create an HD root from the seed using bip32.
    const root = bip32.fromSeed(seed);
    // 4. Derive a child key using a standard derivation path.
    // For Ethereum, a common path is "m/44'/60'/0'/0/0"
    const derivationPath = "m/44'/60'/0'/0/0";
    const child = root.derivePath(derivationPath);

    if (!child.privateKey) {
      throw new InternalServerErrorException('Failed to derive private key');
    }
    // Convert the Uint8Array to a Buffer, then to a hex string:
    const privateKey = Buffer.from(child.privateKey).toString('hex');

    // Encrypt the private key using AES-256-CBC.
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv,
    );
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const encryptedPrivateKey = iv.toString('hex') + ':' + encrypted;

    // 5. Derive the public key.
    // Again, convert the Uint8Array to a Buffer then to hex:
    const publicKeyHex = Buffer.from(child.publicKey).toString('hex');
    // If the key is uncompressed, it will be 130 hex characters and start with '04'.
    // For Ethereum, drop the first byte and take the keccak256 hash of the rest.
    const uncompressed =
      publicKeyHex.length === 130 && publicKeyHex.startsWith('04')
        ? publicKeyHex.slice(2)
        : publicKeyHex;
    // 6. Compute the Ethereum address:
    const hash = keccak256(Buffer.from(uncompressed, 'hex'));
    // The Ethereum address is the last 20 bytes of the hash.
    const address = toChecksumAddress('0x' + hash.slice(-20).toString('hex'));

    return { mnemonic, publicKey: publicKeyHex, encryptedPrivateKey, address };
  }

  /**
   * Validate an Ethereum address.
   * Ethereum addresses are 42 characters long (including the 0x prefix).
   */
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Calculates the confirmed balance by scanning transactions from the confirmed blocks.
   */
  calculateConfirmedBalance(address: string): number {
    return this.blockchainService.getChain().reduce((balance, block) => {
      block.transactions.forEach((tx) => {
        if (tx.recipient === address) {
          balance += tx.amount;
        }
        if (tx.sender === address) {
          balance -= tx.amount;
        }
      });
      return balance;
    }, 0);
  }

  /**
   * Calculates the pending balance by scanning the transactions currently in the pool.
   */
  calculatePendingBalance(address: string): number {
    return this.transactionPoolService
      .getPendingTransactions()
      .reduce((balance, tx) => {
        if (tx.recipient === address) {
          balance += tx.amount;
        }
        if (tx.sender === address) {
          balance -= tx.amount;
        }
        return balance;
      }, 0);
  }

  /**
   * Returns the total balance (confirmed + pending) for a given address.
   */
  getBalance(address: string): number {
    const confirmed = this.calculateConfirmedBalance(address);
    const pending = this.calculatePendingBalance(address);
    return confirmed + pending;
  }

  /**
   * Decrypt an encrypted private key.
   * Use this function only when you need the raw private key (e.g., to sign a transaction).
   */
  decryptPrivateKey(encryptedPrivateKey: string): string {
    if (!this.encryptionKey) {
      throw new InternalServerErrorException(
        'Encryption key is not configured.',
      );
    }

    const [ivHex, encryptedData] = encryptedPrivateKey.split(':');
    if (!ivHex || !encryptedData) {
      throw new Error('Invalid encrypted private key format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv,
    );
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Export the wallet as an encrypted JSON keystore.
   * This format is widely used by Ethereum wallets.
   */
  exportKeystore(encryptedPrivateKey: string, password: string): object {
    // First, decrypt the private key.
    const privateKey = this.decryptPrivateKey(encryptedPrivateKey);
    // Create an Ethereum wallet instance.
    const wallet = Wallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    // Encrypt the wallet with a password.
    return wallet.toV3(password);
  }
}
