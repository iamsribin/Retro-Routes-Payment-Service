// interface IPaymentProcessor {
//   processPayment(data: {
//     bookingId: string;
//     userId: string;
//     driverId: string;
//     amount: number;
//     idempotencyKey: string;
//   }): Promise<{ transactionId: string; message: string; sessionId?: string }>;
//   compensate(data: { transactionId: string }): Promise<void>;
// }

// export { IPaymentProcessor };