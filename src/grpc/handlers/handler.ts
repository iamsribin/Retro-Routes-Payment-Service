import { PaymentController } from "../../controllers/payment-controller";


type Handlers = {
  paymentController: PaymentController;
};

export function createPaymentHandlers(controller:Handlers){
    const {paymentController} = controller;
    return{
        createDriverWallet:paymentController.CreateCheckoutSession
    }
}