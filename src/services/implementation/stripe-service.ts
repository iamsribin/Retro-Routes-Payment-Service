import { IPaymentProcessor } from '../../interfaces/payment.interface';
import { stripe } from '../../config/stripe';
import { logger } from '../../utils/logger';
import { randomUUID } from 'crypto';

export default class StripeService implements IPaymentProcessor {
  async processPayment(data: {
    bookingId: string;
    userId: string;
    driverId: string;
    amount: number;
    idempotencyKey: string;
  }): Promise<{ transactionId: string; message: string; sessionId: string }> {
    try {
      const session = await stripe.checkout.sessions.create(
        {
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'inr',
                product_data: { name: `Ride ${data.bookingId}` },
                unit_amount: Math.round(data.amount * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
          client_reference_id: data.bookingId,
          metadata: { userId: data.userId, driverId: data.driverId, bookingId:data.bookingId },
        },
        { idempotencyKey: data.idempotencyKey }
      );

      return {
        transactionId: session.id,
        sessionId: session.id,
        message: 'Checkout session created',
      };
    } catch (error) {
      logger.error('Stripe error:', error);
      throw new Error(`Failed to create checkout session: ${(error as any).message}`);
    }
  }

  async compensate(data: { transactionId: string }): Promise<void> {
    try {
     await stripe.refunds.create({ payment_intent: data.transactionId });
      logger.info(`Refunded transaction ${data.transactionId}`);
    } catch (error) {
      logger.error('Stripe refund error:', error);
      throw new Error(`Failed to refund transaction: ${(error as any).message}`);
    }
  }
}