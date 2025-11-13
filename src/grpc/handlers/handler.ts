import { GrpcPaymentController } from '../../controllers/grpc-payment-controller';

type Handlers = {
  grpcPaymentController: GrpcPaymentController;
};

export function createPaymentHandlers(controller: Handlers) {
  const { grpcPaymentController } = controller;
  return {
    CreateDriverConnectAccount: grpcPaymentController.createDriverConnectAccount,
  };
}
