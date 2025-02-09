// src/modules/blockchain/schemas/transaction.schema.ts
import { Schema, Document } from 'mongoose';

export const TransactionSchema = new Schema({
  sender: { type: String, required: true },
  recipient: { type: String, required: true },
  amount: { type: Number, required: true },
  signature: { type: String }, // optional if not all transactions have signatures
  mined: { type: Boolean, default: false }, // new field
});

export interface TransactionDocument extends Document {
  sender: string;
  recipient: string;
  amount: number;
  signature?: string;
  mined: boolean;
}
