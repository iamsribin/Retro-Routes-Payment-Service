import { ITransaction } from '../../models/transaction.modal';

export interface ITransactionRepository {
  create(transaction: Partial<ITransaction>): Promise<ITransaction>;
  findByTransactionId(transactionId: string): Promise<ITransaction | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<ITransaction | null>;
  update(transactionId: string, update: Partial<ITransaction>): Promise<ITransaction | null>;
  updateStatusByKey(
    idempotencyKey: string,
    status: 'pending' | 'completed' | 'failed'
  ): Promise<ITransaction | null>;
  updateStatus(
    transactionId: string,
    status: 'pending' | 'completed' | 'failed'
  ): Promise<ITransaction | null>;
}
