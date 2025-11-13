// import { stripe } from "@/config/stripe";
// import { IGrpcPaymentService } from "../interface/i-grpc-payment-service";
// import { injectable } from "inversify";

// @injectable()
// export class GrpcPaymentService  implements IGrpcPaymentService{

//   createDriverConnectAccount = async (
//     email: string,
//     driverId: string
//   ): Promise<{ accountId: string; accountLinkUrl: string }> => {
//     try {
//       const account = stripe.accounts.create({
//         type: "express",
//         country: "GB",
//         email: email,
//         capabilities: {
//           card_payments: { requested: true },
//           transfers: { requested: true },
//         },
//         business_type: "individual",

//         metadata: {
//           driverId: driverId,
//         },
//       });

//       const account_id = (await account).id;

//       const accountLink = await stripe.accountLinks.create({
//         account: account_id,
//         refresh_url: `${process.env.FRONTEND_URL}/onboard/refresh`,
//         return_url: `${process.env.FRONTEND_URL}/onboard/complete`,
//         type: "account_onboarding",
//       });
//       return { accountId: account_id, accountLinkUrl: accountLink.url };
//     } catch (err) {
//       console.log(err);
//       throw new Error("Stripe account creation failed");
//     }
//   };
// }
