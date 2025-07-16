import { Channel, ConsumeMessage } from 'amqplib';
import EventEmitter from 'events';
import rabbitmqConfig from '../config/rabbitmq';

export default class Consumer {
  private messageHandler: ((data: any, routingKey: string) => Promise<any>) | null = null;

  constructor(
    private channel: Channel,
    private queue: string,
    private eventEmitter: EventEmitter
  ) {}

  async consumeMessages() {
    console.log('Ready for consuming Saga messages');
    await this.channel.consume(
      this.queue,
      async (message: ConsumeMessage | null) => {
        if (message && this.messageHandler) {
          try {
            const data = JSON.parse(message.content.toString());
            const routingKey = message.fields.routingKey;
            const result = await this.messageHandler(data, routingKey);
            this.channel.sendToQueue(
              message.properties.replyTo,
              Buffer.from(JSON.stringify(result)),
              { correlationId: message.properties.correlationId }
            );
            this.channel.ack(message);
          } catch (error) {
            console.error('Error processing message:', error);
            this.channel.publish(
              rabbitmqConfig.rabbitMQ.exchange,
              'payment.error',
              Buffer.from(JSON.stringify({ error: (error as any).message })),
              { correlationId: message.properties.correlationId }
            );
            this.channel.reject(message, false);
          }
        }
      },
      { noAck: false }
    );
  }

  setMessageHandler(handler: (data: any, routingKey: string) => Promise<any>) {
    this.messageHandler = handler;
  }
}