import { StatusCode } from "../types/common/status-code";


export interface ConformCashPaymentDto{
    status: StatusCode,
    message: string
}