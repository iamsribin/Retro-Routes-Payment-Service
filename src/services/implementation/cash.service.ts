import { IPaymentProcessor } from '../../interfaces/payment.interface';
import { logger } from '../../utils/logger';
import { randomUUID } from 'crypto';

export default class CashService implements IPaymentProcessor {
  async processPayment(data: {
    bookingId: string;
    userId: string;
    driverId: string;
    amount: number;
    idempotencyKey: string;
  }): Promise<{ transactionId: string; message: string }> {
    try {
      return {
        transactionId: `CASH_${data.bookingId}_${randomUUID()}`,
        message: 'Cash payment initiated',
      };
    } catch (error) {
      logger.error('Cash payment error:', error);
      throw new Error(`Failed to process cash payment: ${(error as any).message}`);
    }
  }

  async compensate(data: { transactionId: string }): Promise<void> {
    logger.info(`No compensation needed for cash transaction ${data.transactionId}`);
  }
}