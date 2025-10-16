import { ConformCashPaymentDto } from "../../dto/paymentRes.dto";

export interface IPaymentService {
  ConfirmCashPayment(data: {
    bookingId: string;
    userId: string;
    driverId: string;
    amount: number;
  }): Promise<ConformCashPaymentDto>;
}
