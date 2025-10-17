import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/mongo';
import PaymentController from './controllers/payment-controller';
import {PaymentService} from './services/implementation/payment-service';
import TransactionRepositoryImpl from './repositories/implementation/transaction.repository';
import { logger } from './utils/logger';

class App {
  constructor() {
    this.initialize();
  }

  private async initialize() {
    await connectDB();
    const transactionRepository = new TransactionRepositoryImpl();
    const paymentService = new PaymentService(transactionRepository);
    this.startGrpcServer(paymentService);
  }

  private startGrpcServer(paymentService: PaymentService) {
    const grpc = require('@grpc/grpc-js');
    const protoLoader = require('@grpc/proto-loader');
    const path = require('path');

    const packageDef = protoLoader.loadSync(path.resolve(__dirname, './proto/payment.proto'), {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const grpcObject = grpc.loadPackageDefinition(packageDef);
    const paymentPackage = grpcObject.payment_package;

    const server = new grpc.Server();
    
    const paymentController = new PaymentController(paymentService);

    server.addService(paymentPackage.Payment.service, {
      CreateCheckoutSession: paymentController.CreateCheckoutSession.bind(paymentController),
      // ProcessWalletPayment: paymentController.ProcessWalletPayment.bind(paymentController),
      ConformCashPayment: paymentController.ConformCashPayment.bind(paymentController),
      // GetTransaction: paymentController.GetTransaction.bind(paymentController),
      // HandleWebhook: paymentController.HandleWebhook.bind(paymentController),
    });

    const port = process.env.PAYMENT_GRPC_PORT || '5003';
    // const domain = process.env.NODE_ENV === 'dev' ? process.env.DEV_DOMAIN : process.env.PRO_DOMAIN_PAYMENT;
   const domain = "localhost"
    server.bindAsync(`${domain}:${port}`, grpc.ServerCredentials.createInsecure(), (err: any, bindPort: number) => {
      if (err) {
        logger.error('Error starting gRPC server:', err);
        return;
      }
      logger.info(`gRPC payment server started on port ${bindPort}`);
    });
  }
}

export default App;