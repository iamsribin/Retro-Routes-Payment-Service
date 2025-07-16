import { Channel } from 'amqplib';
import rabbitmqConfig from '../config/rabbitmq';
import { randomUUID } from 'crypto';
import EventEmitter from 'events';

export default class Producer {
  constructor(
    private channel: Channel,
    private eventEmitter: EventEmitter,
    private replyQueueName: string
  ) {}

// In producer.ts (payment service)
async publish(data: any, routingKey: string) {
  try {
    const correlationId = randomUUID();
    this.channel.publish(
      rabbitmqConfig.rabbitMQ.exchange,
      routingKey,
      Buffer.from(JSON.stringify(data.payload)),
      {
        correlationId,
        persistent: true,
        replyTo: this.replyQueueName,
        headers: {
          function: data.operation 
        }
      }
    );
    return new Promise((resolve, reject) => {
      this.eventEmitter.once(correlationId, async (message) => {
        try {
          const replyData = JSON.parse(message.content.toString());
          resolve(replyData);
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error publishing message:', error);
    throw error;
  }
}
}