import { TransactionRepository } from '../repository';
import { ITransaction } from '../../models/transaction.modal';
import { TransactionModel } from '../../models/transaction.modal';

export default class TransactionRepositoryImpl extends TransactionRepository {
  async create(transaction: Partial<ITransaction>): Promise<ITransaction> {
    return await TransactionModel.create(transaction);
  }

  async findByTransactionId(transactionId: string): Promise<ITransaction | null> {
    return await TransactionModel.findOne({ transactionId });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<ITransaction | null> {
    return await TransactionModel.findOne({ idempotencyKey });
  }

  async update(transactionId: string, update: Partial<ITransaction>): Promise<ITransaction | null> {
    return await TransactionModel.findOneAndUpdate({ transactionId }, update, { new: true });
  }
}