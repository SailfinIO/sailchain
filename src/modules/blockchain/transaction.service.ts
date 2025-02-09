// src/modules/blockchain/transaction.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionDocument } from './schemas/transaction.schema';
import { Transaction } from './classes/Transaction';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel('Transaction')
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async createTransaction(tx: Transaction): Promise<TransactionDocument> {
    const createdTx = new this.transactionModel(tx);
    return createdTx.save();
  }

  async findAll(): Promise<TransactionDocument[]> {
    return this.transactionModel.find().exec();
  }

  async removeTransaction(id: string): Promise<void> {
    await this.transactionModel.findByIdAndDelete(id).exec();
  }

  /**
   * Update a transaction with new data.
   * @param id The ID of the transaction to update.
   * @param updateData The data to update.
   */
  async updateTransaction(
    id: string,
    updateData: Partial<Transaction>,
  ): Promise<TransactionDocument> {
    return this.transactionModel
      .findByIdAndUpdate(id, updateData, {
        new: true,
      })
      .exec();
  }

  /**
   * Mark a single transaction as mined.
   * @param id The ID of the transaction to mark.
   */
  async markTransactionAsMined(id: string): Promise<TransactionDocument> {
    return this.transactionModel
      .findByIdAndUpdate(id, { $set: { mined: true } }, { new: true })
      .exec();
  }

  /**
   * Mark multiple transactions as mined.
   * @param ids An array of transaction IDs to mark as mined.
   */
  async markTransactionsAsMined(ids: string[]): Promise<void> {
    await this.transactionModel
      .updateMany({ _id: { $in: ids } }, { $set: { mined: true } })
      .exec();
  }
}
