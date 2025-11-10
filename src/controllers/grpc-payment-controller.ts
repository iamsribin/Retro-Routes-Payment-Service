import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { injectable } from "inversify";
import { GrpcPaymentService } from "@/services/implementation/grpc-payment-service";


@injectable()
export class GrpcPaymentController {
  constructor(private _grpcPaymentService:GrpcPaymentService){}

  createDriverConnectAccount = async (
    call: ServerUnaryCall<
      { email: string; driverId: string },
      { accountId: string; accountLinkUrl: string }
    >,
    callback: sendUnaryData<{ accountId: string; accountLinkUrl: string }>
  ): Promise<void> => {
    try {
      const { driverId, email } = call.request;

      const accountData = await this._grpcPaymentService.createDriverConnectAccount( email,driverId );

      callback(null, accountData);
    } catch (err) {
      console.log(err);
      throw new Error("Stripe account creation failed");
    }
  };
}
