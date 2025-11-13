import { container } from '@/config/inversify.config';
import { IUserWalletService } from '@/services/interface/i-user-waller-service';
import { TYPES } from '@/types/inversify-types';
import { EXCHANGES, QUEUES, RabbitMQ, ROUTING_KEYS } from '@Pick2Me/shared';

const userWalletService = container.get<IUserWalletService>(TYPES.UserWalletService);
export class UserEventConsumer {
  static async init() {
    await RabbitMQ.setupExchange(EXCHANGES.USER);
    await RabbitMQ.setupQueueWithRetry(
      EXCHANGES.USER,
      QUEUES.PAYMENT_SERVICE,
      ROUTING_KEYS.USER_WALLET_CREATE
    );

    await RabbitMQ.consume(QUEUES.PAYMENT_SERVICE, async (data) => {
      console.log('[PaymentService] 👂 Received wallet.created event:', data);
      await userWalletService.createWalletForUser(data.userId, data.currency);
    });
  }
}
