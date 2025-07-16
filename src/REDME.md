payment-service/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── rabbitmq.config.ts
│   │   ├── stripe.config.ts
│   ├── controllers/
│   │   ├── paymentController.ts
│   ├── interfaces/
│   │   ├── payment.interface.ts
│   │   ├── repository.interface.ts
│   ├── models/
│   │   ├── transaction.model.ts
│   ├── repositories/
│   │   ├── implementation/
│   │   │   ├── transaction.repository.ts
│   │   ├── repository.ts
│   ├── services/
│   │   ├── implementation/
│   │   │   ├── stripe.service.ts
│   │   │   ├── wallet.service.ts
│   │   │   ├── cash.service.ts
│   │   ├── payment.service.ts
│   ├── rabbitmq/
│   │   ├── client.ts
│   │   ├── producer.ts
│   │   ├── consumer.ts
│   ├── proto/
│   │   ├── payment.proto
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── errorHandler.ts
│   ├── .env