import { IPaymentProcessor } from '../../interfaces/payment.interface';
import { ITransaction } from '../../models/transaction.modal'; 
// import rabbitmqClient from '../../rabbitMq/client';
import { logger } from '../../utils/logger';
import { randomUUID } from 'crypto';

export default class WalletService implements IPaymentProcessor {
  async processPayment(data: {
    bookingId: string;
    userId: string;
    driverId: string;
    amount: number;
    idempotencyKey: string;
  }): Promise<{ transactionId: string; message: string }> {
    try {
      // const userData = await this.fetchUserData(data.userId);
      // if (!userData || userData.walletBalance < data.amount) {
      //   throw new Error('Insufficient wallet balance');
      // }

      // await rabbitmqClient.produce(
      //   { userId: data.userId, amount: -data.amount, idempotencyKey: data.idempotencyKey },
      //   'user.wallet.deduct'
      // );

      return {
        transactionId: `WALLET_${data.bookingId}_${randomUUID()}`,
        message: 'Wallet payment successful',
      };
    } catch (error) {
      logger.error('Wallet payment error:', error);
      throw new Error(`Failed to process wallet payment: ${(error as any).message}`);
    }
  }

  async compensate(data: { transactionId: string }): Promise<void> {
    try {
      // const transaction = await rabbitmqClient.produce(
      //   { transactionId: data.transactionId },
      //   'payment.get_transaction'
      // ) as ITransaction;
      // await rabbitmqClient.produce(
      //   { userId: transaction.userId, amount: transaction.amount, idempotencyKey: transaction.idempotencyKey },
      //   'user.wallet.refunded'
      // );
      logger.info(`Compensated wallet transaction ${data.transactionId}`);
    } catch (error) {
      logger.error('Wallet compensation error:', error);
      throw new Error(`Failed to compensate wallet: ${(error as any).message}`);
    }
  }

  // private async fetchUserData(userId: string): Promise<{ walletBalance: number }> {
  //   // const response = await rabbitmqClient.produce({ userId }, 'user.get') as { walletBalance: number };
  //   // return response;
  // }
}