import { Wallet } from '@/models/wallet.entity';
import { QueryRunner } from 'typeorm';

export interface IWalletRepository {
  getForUpdate(queryRunner: QueryRunner, userId: string, currency: string): Promise<Wallet | null>;
  createIfNotExists(userId: string, currency: string);
  applyTransactionTransactional(params: {
    queryRunner: QueryRunner;
    userId: string;
    currency?: string;
    amount: bigint;
    direction: 'credit' | 'debit';
    reason?: string;
    referenceType?: string;
    referenceId?: string;
    idempotencyKey?: string;
    traceId?: string;
    metadata?: any;
  });

  applyTransaction(params: {
    userId: string;
    currency?: string;
    amount: bigint;
    direction: 'credit' | 'debit';
    reason?: string;
    referenceType?: string;
    referenceId?: string;
    idempotencyKey?: string;
    traceId?: string;
    metadata?: any;
  });
}
