import WalletService from "@/services/implementation/wallet-service";
import { EXCHANGES, QUEUES, RabbitMQ, ROUTING_KEYS } from "@Pick2Me/shared";

export class UserEventConsumer {
  static async init() {
    await RabbitMQ.setupExchange(EXCHANGES.USER);
    await RabbitMQ.setupQueueWithRetry(EXCHANGES.USER, QUEUES.PAYMENT_SERVICE, ROUTING_KEYS.USER_WALLET_CREATE);

    await RabbitMQ.consume(QUEUES.PAYMENT_SERVICE, async (data) => {
      console.log(`[PaymentService] 👂 Received wallet.created event:`, data);

    //   await WalletService.createWalletForUser(data.id, data.email);
    });
  }
}
