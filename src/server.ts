import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/mongo';
import PaymentController from './controllers/payment-controller';
import {PaymentService} from './services/implementation/payment-service';
import TransactionRepositoryImpl from './repositories/implementation/transaction.repository';
import { logger } from './utils/logger';
import express from 'express';
import { StripeService } from './services/implementation/stripe-service';
import { IStripeService } from './services/interface/i-stripe-service';
import { IPaymentService } from './services/interface/i-payment-service';

class App {
  constructor() {
    this.initialize();
  }

  private async initialize() {
    await connectDB(); 
    const transactionRepository = new TransactionRepositoryImpl();
    const paymentService = new PaymentService(transactionRepository);
    const stripeService = new StripeService(transactionRepository);
    const paymentController = new PaymentController(paymentService,stripeService);
    this.startGrpcServer(paymentService,stripeService);
    this.startHttpWebhookServer(paymentController)
  }

  private startGrpcServer(paymentService: IPaymentService,stripeService:IStripeService) {
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
    
    const paymentController = new PaymentController(paymentService,stripeService);

    server.addService(paymentPackage.Payment.service, {
      CreateCheckoutSession: paymentController.CreateCheckoutSession.bind(paymentController),
      ConformCashPayment: paymentController.ConformCashPayment.bind(paymentController),
      // ProcessWalletPayment: paymentController.ProcessWalletPayment.bind(paymentController),
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

   private startHttpWebhookServer(paymentController: PaymentController) {
    const app = express();

    app.get('/health', (_req, res) => res.status(200).send('ok'));

    app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
      try {
        await paymentController.handleStripeWebhook(req.body as Buffer, req.headers);
        res.status(200).send({ received: true });
      } catch (err: any) {
        logger.error('Webhook processing failed:', err);
        const code = err.message?.includes('signature') ? 400 : 500;
        res.status(code).send({ error: err.message });
      }
    });

    const httpPort = Number(process.env.PAYMENT_WEBHOOK_PORT || 4242);
    app.listen(httpPort, () => logger.info(`Payment webhook server listening on ${httpPort}`));
  }
}

export default App;