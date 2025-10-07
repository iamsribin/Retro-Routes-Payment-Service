import { handleError } from '../utils/errorHandler';
import PaymentService from '../services/payment-service';
import { Metadata, sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { IResponse } from '../types/common/common-res';
import { ConformCashPaymentDto } from '../dto/paymentRes.dto';

export default class PaymentController {
  constructor(private _paymentService: PaymentService) {}

  async CreateCheckoutSession(
    call: ServerUnaryCall<any, any>,
    callback: (error: Error | null, response: any) => void
  ) {
    try {
      const result = await this._paymentService.createCheckoutSession(call.request);
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
      const result = await this._paymentService.processWalletPayment(call.request);
      callback(null, result);
    } catch (error) {
      handleError(error, callback);
    }
  }

  async ConformCashPayment(
    call: ServerUnaryCall<{bookingId: string, userId: string, driverId: string, amount: number,idempotencyKey:string},any>,
    callback:  sendUnaryData<IResponse<ConformCashPaymentDto>>
  ) {
    try {
      console.log("9000000000ijknm");
      
      const result = await this._paymentService.ConfirmCashPayment(call.request);
      console.log("paymentService",result);
      
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
      const transaction = await this._paymentService.getTransaction(call.request.transactionId);
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
      const result = await this._paymentService.handleWebhook(call.request.payload);
      callback(null, result);
    } catch (error) {
      handleError(error, callback);
    }
  }
}