// import { Channel } from "amqplib";
// import rabbitmqConfig from "../config/rabbitmq";
// import { randomUUID } from "crypto";
// import EventEmitter from "events";

// export default class Producer {
//   constructor(
//     private channel: Channel,
//     private eventEmitter: EventEmitter,
//     private replyQueueName: string
//   ) {}

//   async publish(data: any, routingKey: string) {
//     try {
//       const correlationId = randomUUID();

//       // For saga operations, send with proper structure
//       console.log("data sending to booki",data);
      
//       if (data.operation) {
//         console.log("saga op sern..",this.replyQueueName);
//         console.log("correlationId.",correlationId);
        
//         this.channel.publish(
//           rabbitmqConfig.rabbitMQ.exchange,
//           routingKey,
//           Buffer.from(
//             JSON.stringify({
//               ...data,
//               operation: data.operation,
//             })
//           ),
//           {                       
//             correlationId,
//             persistent: true,    
//             replyTo: this.replyQueueName,
//             headers: {
//               function: data.operation,
//             },
//           }    
//         );
//       } else {
//         // For regular messages
//         this.channel.publish(
//           rabbitmqConfig.rabbitMQ.exchange,
//           routingKey,
//           Buffer.from(JSON.stringify(data)),
//           {
//             correlationId,
//             persistent: true,
//             replyTo: this.replyQueueName,
//           }
//         );
//       }

//       return new Promise((resolve, reject) => {
//         // Set a timeout to prevent hanging
//         const timeout = setTimeout(() => {
//           this.eventEmitter.removeAllListeners(correlationId);
//           reject(new Error("Message timeout"));
//         }, 30000); // 30 second timeout

//         this.eventEmitter.once(correlationId, async (message) => {
//           clearTimeout(timeout);
//           try {
//             const replyData = JSON.parse(message.content.toString());
//             resolve(replyData);
//           } catch (error) {
//             reject(error);
//           }
//         });
//       });
//     } catch (error) {
//       console.error("Error publishing message:", error);
//       throw error;
//     }
//   }
// }
