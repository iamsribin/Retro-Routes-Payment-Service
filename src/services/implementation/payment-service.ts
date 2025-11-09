import { ITransactionRepository } from "../../interfaces/repository.interface";
import { logger } from "../../utils/logger";
import { ConformCashPaymentDto } from "../../dto/paymentRes.dto";
import { StatusCode } from "../../types/common/status-code";
import { RabbitMQPublisher } from "../../events/publisher";
import { randomUUID } from "crypto";
import { IPaymentService } from "../interface/i-payment-service";
import { addDriverEarnings, markBookingAsPaid } from "../../grpc/GrpcClients";

export class PaymentService implements IPaymentService {
  constructor(private _transactionRepository: ITransactionRepository) {}

  async ConfirmCashPayment(data: {
    bookingId: string;
    userId: string;
    driverId: string;
    amount: number;
  }): Promise<ConformCashPaymentDto> {
    try {
      const idempotencyKey = `booking_${data.bookingId}`;
      const existingTransaction =
        await this._transactionRepository.findByIdempotencyKey(idempotencyKey);
      let transaction;

      if (existingTransaction) {
        switch (existingTransaction.status) {
          case "completed":
            return {
              status: StatusCode.Conflict,
              message: "Payment already processed",
            };
          case "pending":
            throw new Error("Payment already in progress");
          case "failed":
            existingTransaction.status = "pending";
            existingTransaction.amount = data.amount;
            existingTransaction.adminShare = Math.round(data.amount * 0.2);
            existingTransaction.driverShare = Math.round(data.amount * 0.8);
            await existingTransaction.save();
            transaction = existingTransaction;
            break;
          default:
            throw new Error("Invalid transaction state");
        }
      } else {
        transaction = await this._transactionRepository.create({
          bookingId: data.bookingId,
          userId: data.userId,
          transactionId: randomUUID(),
          driverId: data.driverId,
          amount: data.amount,
          paymentMethod: "cash",
          status: "pending",
          adminShare: Math.round(data.amount * 0.2),
          driverShare: Math.round(data.amount * 0.8),
          idempotencyKey,
        });
      }

      await markBookingAsPaid(data.bookingId, transaction._id.toString());
      await addDriverEarnings(
        data.driverId,
        Math.round(data.amount * 0.2),
        Math.round(data.amount * 0.8),
        transaction._id.toString(),
        data.bookingId
      );

      await this._transactionRepository.updateStatusByKey(
        idempotencyKey,
        "completed"
      );
      RabbitMQPublisher.publish("payment.completed", data);

      return {
        status: StatusCode.OK,
        message: "Cash payment confirmed successfully",
      };
    } catch (error: any) {
      logger.error("Saga Orchestration Error:", { error: error.message });
      await this._transactionRepository.updateStatusByKey(
        `booking_${data.bookingId}`,
        "failed"
      );
      return {
        status: StatusCode.InternalServerError,
        message:
          error.message || "Something went wrong during cash confirmation",
      };
    }
  }
}
