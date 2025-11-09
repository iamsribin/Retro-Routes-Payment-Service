import { handleError } from "../utils/errorHandler";
import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { IResponse } from "../types/common/common-res";
import { ConformCashPaymentDto } from "../dto/paymentRes.dto";
import { IPaymentService } from "../services/interface/i-payment-service";
import { PaymentReq } from "../types/request";
import { logger } from "../utils/logger";
import { IncomingHttpHeaders } from "http";
import { IStripeService } from "../services/interface/i-stripe-service";

export class PaymentController {
  constructor(
    private _paymentService: IPaymentService,
    private _stripeService: IStripeService
  ) {}

  async CreateCheckoutSession(
    call: ServerUnaryCall<PaymentReq, any>,
    callback: (error: Error | null, response: any) => void
  ) {
    try {
      const result = await this._stripeService.createCheckoutSession(
        call.request
      );
      callback(null, result);
    } catch (error) {
      handleError(error, callback);
    }
  }

  async handleStripeWebhook(
    rawBody: Buffer,
    headers: IncomingHttpHeaders
  ): Promise<void> {
    if (!rawBody || !headers) {
      throw new Error("Missing webhook payload or headers");
    }

    try {
      await this._stripeService.handleStripeWebhook(rawBody, headers);
    } catch (err: any) {
      logger.error("PaymentController.handleStripeWebhook error", {
        error: err?.message ?? err,
      });
      throw err;
    }
  }

  async ConformCashPayment(
    call: ServerUnaryCall<
      {
        bookingId: string;
        userId: string;
        driverId: string;
        amount: number;
        idempotencyKey: string;
      },
      any
    >,
    callback: sendUnaryData<IResponse<ConformCashPaymentDto>>
  ) {
    try {
      const result = await this._paymentService.ConfirmCashPayment(
        call.request
      );

      callback(null, result);
    } catch (error) {
      handleError(error, callback);
    }
  }
}
