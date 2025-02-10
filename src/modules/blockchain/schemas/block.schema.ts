// src/modules/blockchain/schemas/block.schema.ts
import mongoose, { Document, Schema } from 'mongoose';
import { Transaction } from '../classes/Transaction';
import { TransactionSchema } from './transaction.schema';

export const BlockSchema = new Schema({
  index: { type: Number, required: true },
  timestamp: { type: Number, required: true },
  transactions: { type: [TransactionSchema], required: true },
  previousHash: { type: String, required: true },
  hash: { type: String, required: true },
  nonce: { type: Number, required: true },
  difficulty: { type: Number, required: true }, // NEW: Store difficulty with each block
});

// Define an interface for the Block document
export interface BlockDocument extends Document {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number; // NEW: Include difficulty in the interface
}
