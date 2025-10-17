import { ITransactionRepository } from "../../interfaces/repository.interface";
import { logger } from "../../utils/logger";
import { ITransaction } from "../../models/transaction.modal";
import { stripe } from "../../config/stripe";
import { ConformCashPaymentDto } from "../../dto/paymentRes.dto";
import { StatusCode } from "../../types/common/status-code";
import { RabbitMQPublisher } from "../../events/publisher";
import { bookingClient, driverClient } from "../../config/grpc-client";
import { randomUUID } from "crypto";
import { IPaymentService } from "../interface/i-payment-service";
import { StripeCheckoutSessionRes } from "../../types/response";
import { PaymentReq } from "../../types/request";

export class PaymentService implements IPaymentService {
  constructor(
    private _transactionRepository: ITransactionRepository,
  ) {}

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
          idempotencyKey: idempotencyKey,
        });
      }

      await new Promise<any>((resolve, reject) => {
        bookingClient.MarkAsPaid(
          {
            bookingId: data.bookingId,
            paymentId: transaction._id.toString(),
          },
          (err: Error | null, response: any) => {
            if (err) return reject(err);
            if (response.status !== "success")
              return reject(new Error("Failed to update booking"));
            resolve(response);
          }
        );
      });

      await new Promise<any>((resolve, reject) => {
        driverClient.AddEarnings(
          {
            driverId: data.driverId,
            adminShare: Math.round(data.amount * 0.2),
            driverShare: Math.round(data.amount * 0.8),
            transactionId: transaction._id.toString(),
          },
          async (err: Error | null, response: any) => {
            if (err) return reject(err);
            if (response.status !== "success") {
              // rollback booking if driver update fails
              await new Promise<void>((resolveRollback, rejectRollback) => {
                bookingClient.RollbackPayment(
                  { bookingId: data.bookingId },
                  (rollbackErr: Error | null) => {
                    if (rollbackErr) return rejectRollback(rollbackErr);
                    resolveRollback();
                  }
                );
              });
              return reject(new Error("Failed to update driver"));
            }
            resolve(response);
          }
        );
      });

      await this._transactionRepository.updateStatus(
        idempotencyKey,
        "completed"
      );

      RabbitMQPublisher.publish("payment.completed", data);

      return {
        status: StatusCode.OK,
        message: "Cash payment confirmed successfully",
      };
    } catch (error: any) {
      console.error("Saga Orchestration Error:", error.message);
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

  async createCheckoutSession(
    data: PaymentReq
  ): Promise<StripeCheckoutSessionRes> {
    try {
      // basic validation
      if (
        !data ||
        !data.bookingId ||
        !data.userId ||
        !data.driverId ||
        !Number.isFinite(data.amount) ||
        data.amount <= 0
      ) {
        return {
          status: StatusCode.BadRequest,
          message: "Invalid payment request",
        };
      }

      const idempotencyKey = `booking_${data.bookingId}`;
      const cents = Math.round(data.amount * 100);

      let transaction = (await this._transactionRepository.findByIdempotencyKey(
        idempotencyKey
      )) as ITransaction | null;

      if (transaction) {
        switch (transaction.status) {
          case "completed":
            return {
              status: StatusCode.Conflict,
              message: "Payment already processed",
            };

          case "pending":
            if (transaction.stripeSessionId) {
              return {
                status: StatusCode.OK,
                message: "Payment already in progress",
                sessionId: transaction.stripeSessionId,
              };
            }
            return {
              status: StatusCode.Conflict,
              message: "Payment already in progress",
            };

          case "failed":
            await this._transactionRepository.update(
              transaction.transactionId,
              {
                status: "pending",
                amount: data.amount,
                adminShare: Math.round(data.amount * 0.2),
                driverShare: Math.round(data.amount * 0.8),
              }
            );
            break;

          default:
            return {
              status: StatusCode.InternalServerError,
              message: "Invalid transaction state",
            };
        }
      } else {
        transaction = (await this._transactionRepository.create({
          bookingId: data.bookingId,
          userId: data.userId,
          driverId: data.driverId,
          transactionId: randomUUID(),
          amount: data.amount,
          paymentMethod: "stripe",
          status: "pending",
          adminShare: Math.round(data.amount * 0.2),
          driverShare: Math.round(data.amount * 0.8),
          idempotencyKey,
        })) as ITransaction;
      }

      const session = await stripe.checkout.sessions.create(
        {
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: process.env.PAYMENT_CURRENCY ?? "usd",
                product_data: { name: "Ride Payment" },
                unit_amount: cents,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
          metadata: {
            bookingId: data.bookingId,
            userId: data.userId,
            driverId: data.driverId,
            localTransactionId: transaction.transactionId ?? "",
          },
        },
        {
          idempotencyKey,
        }
      );

      await this._transactionRepository.update(transaction.transactionId, {
        stripeSessionId: session.id,
      });
console.log("session",session);

      return {
        status: StatusCode.OK,
        message: "Checkout session created",
        sessionId: session.id,
      };
    } catch (err: any) {

      try {
        if (data?.bookingId) {
          await this._transactionRepository.updateStatusByKey(
            `booking_${data.bookingId}`,
            "failed"
          );
        } 
      } catch (upErr) {
        logger.error("Failed to update transaction status after stripe error", {
          error: upErr,
        });
      }

      return {
        status: StatusCode.InternalServerError,
        message: err?.message ?? "Failed to create checkout session",
      };
    }
  }

  // async processWalletPayment(data: {
  //   bookingId: string;
  //   userId: string;
  //   driverId: string;
  //   amount: number;
  //   idempotencyKey: string;
  // }): Promise<{ transactionId: string; message: string }> {
  //   const existingTransaction =
  //     await this._transactionRepository.findByIdempotencyKey(
  //       data.idempotencyKey
  //     );

  //   if (existingTransaction) {
  //     if (existingTransaction.status === "completed") {
  //       return {
  //         transactionId: existingTransaction.transactionId,
  //         message: "Payment already processed",
  //       };
  //     }
  //     throw new Error("Payment already in progress");
  //   }

  //   await this.validateData(data);
  //   const result = await this.walletProcessor.processPayment(data);
  //   await this._transactionRepository.create({
  //     transactionId: result.transactionId,
  //     bookingId: data.bookingId,
  //     userId: data.userId,
  //     driverId: data.driverId,
  //     amount: data.amount,
  //     paymentMethod: "wallet",
  //     status: "completed",
  //     adminShare: data.amount * 0.2,
  //     driverShare: data.amount * 0.8,
  //     idempotencyKey: data.idempotencyKey,
  //   });
  //   // await rabbitmqClient.produce(
  //   //   {
  //   //     transactionId: result.transactionId,
  //   //     bookingId: data.bookingId,
  //   //     userId: data.userId,
  //   //     driverId: data.driverId,
  //   //     amount: data.amount,
  //   //   },
  //   //   "payment.completed"
  //   // );
  //   return result;
  // }

  async getTransaction(transactionId: string): Promise<ITransaction> {
    const transaction = await this._transactionRepository.findByTransactionId(
      transactionId
    );
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    return transaction;
  }

  async handleWebhook(payload: string): Promise<{ message: string }> {
    const event = JSON.parse(payload);
    try {
      const session = event.data.object;
      if (event.type === "checkout.session.completed") {
        const transaction =
          await this._transactionRepository.findByTransactionId(session.id);
        if (!transaction) {
          throw new Error("Transaction not found");
        }
        await this._transactionRepository.update(session.id, {
          status: "completed",
        });
        // await rabbitmqClient.produce(
        //   {
        //     transactionId: session.id,
        //     bookingId: transaction.bookingId,
        //     userId: transaction.userId,
        //     driverId: transaction.driverId,
        //     amount: transaction.amount,
        //   },
        //   "payment.completed"
        // );
        return { message: "Webhook processed: payment completed" };
      } else if (event.type === "checkout.session.expired") {
        await this._transactionRepository.update(session.id, {
          status: "failed",
          failureReason: "Session expired",
        });
        // await rabbitmqClient.produce(
        //   { transactionId: session.id },
        //   "payment.failed"
        // );
        return { message: "Webhook processed: payment failed" };
      }
      return { message: "Webhook ignored" };
    } catch (error) {
      logger.error("Webhook error:", error);
      throw error;
    }
  }

  private async validateData(data: {
    bookingId: string;
    userId: string;
    driverId: string;
    amount: number;
  }) {
    console.log("validating data");

    // const bookingData = (await rabbitmqClient.produce(
    //   {
    //     operation: "booking.validate_booking_id",
    //     payload: { bookingId: data.bookingId },
    //   },
    //   "booking.validate_booking_id"
    // )) as BookingData;

    // console.log("bookingData", bookingData);
    // // console.log("driverData", driverData);

    // if (!bookingData) {
    //   throw new Error("Invalid booking or driver data");
    // }
    // if (bookingData.price !== data.amount) {
    //   throw new Error("Amount mismatch with booking price");
    // }
  }

  private async setupSagaConsumer() {
    // await rabbitmqClient.consume(async (data, routingKey) => {
    //   try {
    //     if (routingKey === "payment.pending") {
    //       if (data.paymentMethod === "stripe") {
    //         await this.createCheckoutSession(data);
    //       } else if (data.paymentMethod === "wallet") {
    //         await this.processWalletPayment(data);
    //       } else if (data.paymentMethod === "cash") {
    //         await this.ConformCashPayment(data);
    //       }
    //     } else if (
    //       routingKey === "saga.booking.updated" ||
    //       routingKey === "saga.driver.updated"
    //     ) {
    //       console.log("Received saga message:", routingKey, data);
    //       const transaction =
    //         await this._transactionRepository.findByTransactionId(
    //           data.transactionId
    //         );
    //       if (!transaction) {
    //         throw new Error("Transaction not found");
    //       }
    //       // Update saga status
    //       if (routingKey === "saga.booking.updated") {
    //         console.log("Received saga message:", routingKey, data);
    //         this.sagaStatusMap[data.transactionId].bookingUpdated = true;
    //       } else if (routingKey === "saga.driver.updated") {
    //         this.sagaStatusMap[data.transactionId].driverUpdated = true;
    //       }
    //       // Check if both updates are complete
    //       if (
    //         this.sagaStatusMap[data.transactionId].bookingUpdated &&
    //         this.sagaStatusMap[data.transactionId].driverUpdated
    //       ) {
    //         await this._transactionRepository.update(data.transactionId, {
    //           status: "completed",
    //         });
    //         await rabbitmqClient.produce(
    //           { transactionId: data.transactionId },
    //           "payment.completed"
    //         );
    //         delete this.sagaStatusMap[data.transactionId];
    //       }
    //     } else if (
    //       routingKey === "saga.booking.update_failed" ||
    //       routingKey === "saga.driver.update_failed"
    //     ) {
    //       const transaction =
    //         await this._transactionRepository.findByTransactionId(
    //           data.transactionId
    //         );
    //       if (!transaction) {
    //         throw new Error("Transaction not found");
    //       }
    //       await this._transactionRepository.update(data.transactionId, {
    //         status: "failed",
    //         failureReason: `Saga failed due to ${routingKey}`,
    //       });
    //       await rabbitmqClient.produce(
    //         { transactionId: data.transactionId },
    //         "payment.failed"
    //       );
    //       delete this.sagaStatusMap[data.transactionId];
    //     }
    //   } catch (error) {
    //     logger.error("Saga consumer error:", error);
    //   }
    // });
  }
}
