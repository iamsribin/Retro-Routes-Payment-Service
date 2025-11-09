import * as grpc from '@grpc/grpc-js';
import { paymentServiceDescriptor } from '@Pick2Me/shared';
import { createPaymentHandlers } from './handlers/handler';
import { container } from '../config/inversify.config';
import { TYPES } from '../types/inversify-types';
import { PaymentController } from '../controllers/payment-controller';

if (!paymentServiceDescriptor) {
  console.error('userServiceDescriptor is missing. Inspect loaded proto package.');
  process.exit(1);
}

const paymentController = container.get<PaymentController>(TYPES.PaymentController);

const handlers = createPaymentHandlers({
  paymentController,
});

export const startGrpcServer = () => {
  try {
    const server = new grpc.Server();

    // Register driver service gRPC functions
    server.addService(paymentServiceDescriptor, handlers);

    // Bind server
    server.bindAsync(
      process.env.GRPC_URL as string,
      grpc.ServerCredentials.createInsecure(),
      () => {
        console.log(`GRPC server for user service running on port ${process.env.GRPC_URL}`);
      }
    );
  } catch (err) {
    console.log(err);
  }
};
