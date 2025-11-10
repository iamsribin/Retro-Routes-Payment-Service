import { StatusCode } from "@Pick2Me/shared";

export interface StripeCheckoutSessionRes {
  status: StatusCode;
  sessionId?: string;
  message: string;
}
