import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/inversify-types";
import { IPaymentService } from "@/services/interface/i-payment-service";
import { IDriverWalletService } from "@/services/interface/i-driver-wallet-service";

@injectable()
export class GrpcPaymentController {
  constructor(@inject(TYPES.DriverWalletService) private _driverWalletService:IDriverWalletService){}

  createDriverConnectAccount = async (
    call: ServerUnaryCall<
      { email: string; driverId: string },
      { accountId: string; accountLinkUrl: string }
    >,
    callback: sendUnaryData<{ accountId: string; accountLinkUrl: string }>
  ): Promise<void> => {
    try {
      const { driverId, email } = call.request;

      const accountData = await this._driverWalletService.createDriverConnectAccount( email,driverId );

      callback(null, accountData);
    } catch (err) {
      console.log(err);
      throw new Error("Stripe account creation failed");
    }
  };
}
