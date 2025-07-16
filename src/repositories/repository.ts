import { ITransactionRepository } from '../interfaces/repository.interface';
import { ITransaction } from '../models/transaction.modal';

export abstract class TransactionRepository implements ITransactionRepository {
  abstract create(transaction: Partial<ITransaction>): Promise<ITransaction>;
  abstract findByTransactionId(transactionId: string): Promise<ITransaction | null>;
  abstract findByIdempotencyKey(idempotencyKey: string): Promise<ITransaction | null>;
  abstract update(transactionId: string, update: Partial<ITransaction>): Promise<ITransaction | null>;
}