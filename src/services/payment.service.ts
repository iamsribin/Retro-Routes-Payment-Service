import { IPaymentProcessor } from '../interfaces/payment.interface';
import { ITransactionRepository } from '../interfaces/repository.interface';
import { BookingData, UserData, DriverData } from '../interfaces/rabbitMp.interface'; 
import rabbitmqClient from '../rabbitMq/client';
import { logger } from '../utils/logger';
import { ITransaction } from '../models/transaction.modal';
import { stripe } from '../config/stripe';
import rabbitmqConfig from '../config/rabbitmq';

export default class PaymentService {
  constructor(
    private stripeProcessor: IPaymentProcessor,
    private walletProcessor: IPaymentProcessor,
    private cashProcessor: IPaymentProcessor,
    private transactionRepository: ITransactionRepository
  ) {
    this.setupSagaConsumer();
  }

  async createCheckoutSession(data: {
    bookingId: string;
    userId: string;
    driverId: string;
    amount: number;
    idempotencyKey: string;
  }): Promise<{ sessionId: string; message: string }> {
    const existingTransaction = await this.transactionRepository.findByIdempotencyKey(data.idempotencyKey);
    if (existingTransaction) {
      if (existingTransaction.status === 'completed') {
        if (!existingTransaction.stripeSessionId) {
          throw new Error('No session ID found for completed transaction');
        }
        return { sessionId: existingTransaction.stripeSessionId, message: 'Payment already processed' };
      }
      throw new Error('Payment already in progress');
    }

    await this.validateData(data);
    const result = await this.stripeProcessor.processPayment(data);
    if (!result.sessionId) {
      throw new Error('Stripe session ID is missing');
    }
    await this.transactionRepository.create({
      transactionId: result.transactionId,
      bookingId: data.bookingId,
      userId: data.userId,
      driverId: data.driverId,
      amount: data.amount,
      paymentMethod: 'stripe',
      status: 'pending',
      adminShare: data.amount * 0.2,
      driverShare: data.amount * 0.8,
      stripeSessionId: result.sessionId,
      idempotencyKey: data.idempotencyKey,
    });
    await rabbitmqClient.produce(
      { transactionId: result.transactionId, bookingId: data.bookingId, userId: data.userId, driverId: data.driverId, amount: data.amount },
      'payment.completed'
    );
    return { sessionId: result.sessionId, message: result.message };
  }

  async processWalletPayment(data: {
    bookingId: string;
    userId: string;
    driverId: string;
    amount: number;
    idempotencyKey: string;
  }): Promise<{ transactionId: string; message: string }> {
    const existingTransaction = await this.transactionRepository.findByIdempotencyKey(data.idempotencyKey);
    if (existingTransaction) {
      if (existingTransaction.status === 'completed') {
        return { transactionId: existingTransaction.transactionId, message: 'Payment already processed' };
      }
      throw new Error('Payment already in progress');
    }

    await this.validateData(data);
    const result = await this.walletProcessor.processPayment(data);
    await this.transactionRepository.create({
      transactionId: result.transactionId,
      bookingId: data.bookingId,
      userId: data.userId,
      driverId: data.driverId,
      amount: data.amount,
      paymentMethod: 'wallet',
      status: 'completed',
      adminShare: data.amount * 0.2,
      driverShare: data.amount * 0.8,
      idempotencyKey: data.idempotencyKey,
    });
    await rabbitmqClient.produce(
      { transactionId: result.transactionId, bookingId: data.bookingId, userId: data.userId, driverId: data.driverId, amount: data.amount },
      'payment.completed'
    );
    return result;
  }

  async processCashPayment(data: {
    bookingId: string;
    userId: string;
    driverId: string;
    amount: number;
    idempotencyKey: string;
  }): Promise<{ transactionId: string; message: string }> {
    const existingTransaction = await this.transactionRepository.findByIdempotencyKey(data.idempotencyKey);
    if (existingTransaction) {
      if (existingTransaction.status === 'completed') {
        return { transactionId: existingTransaction.transactionId, message: 'Payment already processed' };
      }
      throw new Error('Payment already in progress');
    }

    await this.validateData(data);
    const result = await this.cashProcessor.processPayment(data);
    await this.transactionRepository.create({
      transactionId: result.transactionId,
      bookingId: data.bookingId,
      userId: data.userId,
      driverId: data.driverId,
      amount: data.amount,
      paymentMethod: 'cash',
      status: 'pending',
      adminShare: data.amount * 0.2,
      driverShare: data.amount * 0.8,
      idempotencyKey: data.idempotencyKey,
    });
    await rabbitmqClient.produce(
      { transactionId: result.transactionId, bookingId: data.bookingId, userId: data.userId, driverId: data.driverId, amount: data.amount },
      'payment.cash.initiated'
    );
    return result;
  }

  async getTransaction(transactionId: string): Promise<ITransaction> {
    const transaction = await this.transactionRepository.findByTransactionId(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  }

  async handleWebhook(payload: string): Promise<{ message: string }> {
    const event = JSON.parse(payload);
    try {
      const session = event.data.object;
      if (event.type === 'checkout.session.completed') {
        const transaction = await this.transactionRepository.findByTransactionId(session.id);
        if (!transaction) {
          throw new Error('Transaction not found');
        }
        await this.transactionRepository.update(session.id, { status: 'completed' });
        await rabbitmqClient.produce(
          {
            transactionId: session.id,
            bookingId: transaction.bookingId,
            userId: transaction.userId,
            driverId: transaction.driverId,
            amount: transaction.amount,
          },
          'payment.completed'
        );
        return { message: 'Webhook processed: payment completed' };
      } else if (event.type === 'checkout.session.expired') {
        await this.transactionRepository.update(session.id, {
          status: 'failed',
          failureReason: 'Session expired',
        });
        await rabbitmqClient.produce(
          { transactionId: session.id },
          'payment.failed'
        );
        return { message: 'Webhook processed: payment failed' };
      }
      return { message: 'Webhook ignored' };
    } catch (error) {
      logger.error('Webhook error:', error);
      throw error;
    }
  }

private async validateData(data: { bookingId: string; userId: string; driverId: string; amount: number }) {
  console.log("validating data");
  
  const [bookingData] = await Promise.all([
    rabbitmqClient.produce(
      { 
        operation: 'booking.get', 
        payload: { bookingId: data.bookingId } 
      },
      'booking.get'
    ) as Promise<BookingData>,

    // rabbitmqClient.produce(
    //   { 
    //     operation: 'user.get', 
    //     payload: { userId: data.userId } 
    //   },
    //   'user.get'
    // ) as Promise<UserData>,

    // rabbitmqClient.produce(
    //   { 
    //     operation: 'driver.get', 
    //     payload: { driverId: data.driverId } 
    //   },
    //   'driver.get'
    // ) as Promise<DriverData>,
  ]);
console.log("bookingData",bookingData);

  if (!bookingData ) {
    throw new Error('Invalid booking, user, or driver data');
  }
  if (bookingData.price !== data.amount) {
    throw new Error('Amount mismatch with booking price');
  }
}
  private async setupSagaConsumer() {
    await rabbitmqClient.consume(async (data, routingKey) => {
      try {
        if (routingKey === 'payment.pending') {
          if (data.paymentMethod === 'stripe') {
            await this.createCheckoutSession(data);
          } else if (data.paymentMethod === 'wallet') {
            await this.processWalletPayment(data);
          } else if (data.paymentMethod === 'cash') {
            await this.processCashPayment(data);
          }
        } else if (routingKey === 'booking.update_failed' || routingKey === 'driver.update_failed' || routingKey === 'user.wallet_failed') {
          const transaction = await this.transactionRepository.findByTransactionId(data.transactionId);
          if (!transaction) {
            throw new Error('Transaction not found');
          }
          if (transaction.paymentMethod === 'stripe') {
            await this.stripeProcessor.compensate({ transactionId: transaction.transactionId });
          } else if (transaction.paymentMethod === 'wallet') {
            await this.walletProcessor.compensate({ transactionId: transaction.transactionId });
          }
          await this.transactionRepository.update(transaction.transactionId, {
            status: 'failed',
            failureReason: `Saga failed due to ${routingKey}`,
          });
          await rabbitmqClient.produce(
            { transactionId: transaction.transactionId },
            'payment.failed'
          );
        }
      } catch (error) {
        logger.error('Saga consumer error:', error);
      }
    });
  }
}