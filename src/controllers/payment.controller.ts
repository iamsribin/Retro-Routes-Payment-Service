import { handleError } from '../utils/errorHandler';
import PaymentService from '../services/payment.service';
import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';

export default class PaymentController {
  constructor(private paymentService: PaymentService) {}

  async CreateCheckoutSession(
    call: ServerUnaryCall<any, any>,
    callback: (error: Error | null, response: any) => void
  ) {
    try {
      const result = await this.paymentService.createCheckoutSession(call.request);
      callback(null, result);
    } catch (error) {
      handleError(error, callback);
    }
  }

  async ProcessWalletPayment(
    call: ServerUnaryCall<any, any>,
    callback: (error: Error | null, response: any) => void
  ) {
    try {
      const result = await this.paymentService.processWalletPayment(call.request);
      callback(null, result);
    } catch (error) {
      handleError(error, callback);
    }
  }

  async ProcessCashPayment(
    call: ServerUnaryCall<any, any>,
    callback: (error: Error | null, response: any) => void
  ) {
    try {
      console.log("ethi...");
      
      const result = await this.paymentService.processCashPayment(call.request);
      callback(null, result);
    } catch (error) {
      handleError(error, callback);
    }
  }

  async GetTransaction(
    call: ServerUnaryCall<any, any>,
    callback: (error: Error | null, response: any) => void
  ) {
    try {
      const transaction = await this.paymentService.getTransaction(call.request.transactionId);
      callback(null, {
        transactionId: transaction.transactionId,
        bookingId: transaction.bookingId,
        userId: transaction.userId,
        driverId: transaction.driverId,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        createdAt: transaction.createdAt.toISOString(),
        adminShare: transaction.adminShare,
        driverShare: transaction.driverShare,
      });
    } catch (error) {
      handleError(error, callback);
    }
  }

  async HandleWebhook(
    call: ServerUnaryCall<any, any>,
    callback: (error: Error | null, response: any) => void
  ) {
    try {
      const result = await this.paymentService.handleWebhook(call.request.payload);
      callback(null, result);
    } catch (error) {
      handleError(error, callback);
    }
  }
}