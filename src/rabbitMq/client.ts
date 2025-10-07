// // src/rabbitMq/client.ts
// import { Channel, connect, Connection } from "amqplib";
// import rabbitmqConfig from "../config/rabbitmq";
// import Producer from "./producer";
// import { EventEmitter } from "events";
// import Consumer from "./consumer";

// class RabbitMqClient {
//   private static instance: RabbitMqClient;
//   private isInitialized = false;
//   private producer: Producer | undefined;
//   private consumer: Consumer | undefined;
//   private connection: Connection | undefined;
//   private produceChannel: Channel | undefined;
//   private consumerChannel: Channel | undefined;
//   private eventEmitter: EventEmitter | undefined;
//   private replyQueueName: string | undefined;

//   public static getInstance() {
//     if (!this.instance) {
//       this.instance = new RabbitMqClient();
//     }
//     return this.instance;
//   }

//   async initialize() {
//     if (this.isInitialized) return;
//     try {
//       this.connection = await connect(rabbitmqConfig.rabbitMQ.url);
//       const [produceChannel, consumerChannel] = await Promise.all([
//         this.connection.createChannel(),
//         this.connection.createChannel(),
//       ]);
//       this.produceChannel = produceChannel;
//       this.consumerChannel = consumerChannel;

//       const exchange = rabbitmqConfig.rabbitMQ.exchange;

//       await Promise.all([
//         this.produceChannel.assertExchange(exchange, "topic", { durable: true }),
//         this.consumerChannel.assertExchange(exchange, "topic", { durable: true }),
//       ]);

//       const queues = rabbitmqConfig.rabbitMQ.queues;
//       await Promise.all([
//         this.produceChannel.assertQueue(queues.paymentQueue, { durable: true }),
//         this.produceChannel.assertQueue(queues.bookingQueue, { durable: true }),
//         this.produceChannel.assertQueue(queues.driverQueue, { durable: true }),
//         this.produceChannel.assertQueue(queues.sagaQueue, { durable: true }),
//         this.produceChannel.assertQueue(queues.deadLetterQueue, { durable: true }),
//         this.consumerChannel.assertQueue(queues.paymentQueue, { durable: true }),
//       ]);

//       const { queue: replyQueueName } = await this.consumerChannel.assertQueue("", {
//         exclusive: false,
//       });
//       this.replyQueueName = replyQueueName;

//       // Bind relevant topics
//       const bindings = [
//         { queue: queues.paymentQueue, pattern: "payment.*" },
//         { queue: queues.sagaQueue, pattern: "saga.*" },
//         { queue: queues.bookingQueue, pattern: "booking.*" },
//         { queue: queues.driverQueue, pattern: "driver.*" },
//       ];

//       for (const { queue, pattern } of bindings) {
//         await this.consumerChannel.bindQueue(queue, exchange, pattern);
//       }

//       this.eventEmitter = new EventEmitter();
//       this.producer = new Producer(this.produceChannel, this.eventEmitter, this.replyQueueName);
//       this.consumer = new Consumer(this.consumerChannel, queues.paymentQueue, this.eventEmitter);
//       await this.consumer.consumeMessages();

//       this.isInitialized = true;

//       await this.consumerChannel.consume(
//         this.replyQueueName,
//         (msg) => {
//           if (msg) {
//             const correlationId = msg.properties.correlationId;
//             this.eventEmitter?.emit(correlationId, msg);
//           }
//         },
//         { noAck: true }
//       );
//     } catch (error) {
//       console.error("RabbitMQ error:", error);
//     }
//   }

//   async produce(data: any, routingKey: string) {
//     if (!this.isInitialized) {
//       await this.initialize();
//     }
//     return await this.producer?.publish(data, routingKey);
//   }

// async produceSagaMessage(data: any, routingKey: string) {
//   if (!this.isInitialized) {
//     await this.initialize();
//   }
// console.log("hdkasjal",data,",,rouer=",routingKey);

//   // For saga operations, include the operation in headers
//   const operation = routingKey.split('.').pop(); // Extract operation from routing key
  
//   this.produceChannel?.publish(
//     rabbitmqConfig.rabbitMQ.exchange,
//     routingKey,
//     Buffer.from(JSON.stringify(data)),
//     { 
//       persistent: true,
//       headers: {
//         function: operation // Add the function header that booking service expects
//       }
//     }
//   );
// }

// // Alternative approach - include operation in the message payload
// // async produceSagaMessage(data: any, routingKey: string) {
// //   if (!this.isInitialized) {
// //     await this.initialize();
// //   }

// //   const operation = routingKey.split('.').pop(); // Extract operation from routing key
  
// //   // Include operation in the message payload
// //   const messageData = {
// //     operation: operation,
// //     ...data
// //   };
  
// //   this.produceChannel?.publish(
// //     rabbitmqConfig.rabbitMQ.exchange,
// //     routingKey,
// //     Buffer.from(JSON.stringify(messageData)),
// //     { 
// //       persistent: true,
// //       headers: {
// //         function: operation
// //       }
// //     }
// //   );
// // }


//   async consume(handler: (data: any, routingKey: string) => Promise<any>) {
//     if (!this.isInitialized) {
//       await this.initialize();
//     }
//     this.consumer?.setMessageHandler(handler);
//   }
// }

// export default RabbitMqClient.getInstance();
