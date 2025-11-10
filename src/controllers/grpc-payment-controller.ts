import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { stripe } from "../config/stripe";
import { injectable } from "inversify";


@injectable()
export class GrpcPaymentController {
  createDriverConnectAccount = async (
    call: ServerUnaryCall<
      { email: string; driverId: string },
      { accountId: string; accountLinkUrl: string }
    >,
    callback: sendUnaryData<{ accountId: string; accountLinkUrl: string }>
  ): Promise<void> => {
    try {
      const { driverId, email } = call.request;
     console.log({ driverId, email });

      const account = stripe.accounts.create({
        type: "express",
        country: "GB",
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",

        metadata: {
          driverId: driverId,
        },
      });

      const account_id = (await account).id;

      const accountLink = await stripe.accountLinks.create({
        account: account_id,
        refresh_url: `${process.env.FRONTEND_URL}/onboard/refresh`,
        return_url: `${process.env.FRONTEND_URL}/onboard/complete`,
        type: "account_onboarding",
      });

      callback(null, { accountId: account_id, accountLinkUrl: accountLink.url });
    } catch (err) {
      console.log(err);
      throw new Error("Stripe account creation failed");
    }
  };
}
