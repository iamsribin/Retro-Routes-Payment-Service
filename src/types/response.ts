import { StatusCode } from "./common/status-code";

export interface StripeCheckoutSessionRes {
  status: StatusCode;
  sessionId?: string;
  message: string;
}
