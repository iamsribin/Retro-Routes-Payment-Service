import { Channel, connect, Connection } from "amqplib";
import rabbitmqConfig from "../config/rabbitmq";
import Producer from "./producer";
import { EventEmitter } from "events";
import Consumer from "./consumer";

class RabbitMqClient {
  private static instance: RabbitMqClient;
  private isInitialized = false;
  private producer: Producer | undefined;
  private consumer: Consumer | undefined;
  private connection: Connection | undefined;
  private produceChannel: Channel | undefined;
  private consumerChannel: Channel | undefined;
  private eventEmitter: EventEmitter | undefined;
  private replyQueueName: string | undefined;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RabbitMqClient();
    }
    return this.instance;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }
    try {
      this.connection = await connect(rabbitmqConfig.rabbitMQ.url);
      const [produceChannel, consumerChannel] = await Promise.all([
        this.connection.createChannel(),
        this.connection.createChannel(),
      ]);
      this.produceChannel = produceChannel;
      this.consumerChannel = consumerChannel;

      // Declare exchange for Saga events
      await this.produceChannel.assertExchange(
        rabbitmqConfig.rabbitMQ.exchange,
        "topic",
        { durable: true }
      );
      await this.consumerChannel.assertExchange(
        rabbitmqConfig.rabbitMQ.exchange,
        "topic",
        { durable: true }
      );

      // Declare queues
      await Promise.all([
        this.produceChannel.assertQueue(
          rabbitmqConfig.rabbitMQ.queues.paymentQueue,
          { durable: true }
        ),
        this.produceChannel.assertQueue(
          rabbitmqConfig.rabbitMQ.queues.deadLetterQueue,
          { durable: true }
        ),
        this.consumerChannel.assertQueue(
          rabbitmqConfig.rabbitMQ.queues.paymentQueue,
          { durable: true }
        ),
      ]);

      const { queue: replyQueueName } = await this.consumerChannel.assertQueue(
        "",
        { exclusive: false }
      );
      this.replyQueueName = replyQueueName;

      await this.consumerChannel.bindQueue(
        rabbitmqConfig.rabbitMQ.queues.paymentQueue,
        rabbitmqConfig.rabbitMQ.exchange,
        "payment.*"
      );

      await this.consumerChannel.bindQueue(
        rabbitmqConfig.rabbitMQ.queues.bookingQueue,
        rabbitmqConfig.rabbitMQ.exchange,
        "booking.*"
      );

      this.eventEmitter = new EventEmitter();
      this.producer = new Producer(
        this.produceChannel,
        this.eventEmitter,
        this.replyQueueName
      );
      this.consumer = new Consumer(
        this.consumerChannel,
        rabbitmqConfig.rabbitMQ.queues.paymentQueue,
        this.eventEmitter
      );
      await this.consumer.consumeMessages();
      this.isInitialized = true;
    } catch (error) {
      console.error("RabbitMQ error:", error);
    }
  }

  async produce(data: any, routingKey: string) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return await this.producer?.publish(data, routingKey);
  }

  async consume(handler: (data: any, routingKey: string) => Promise<any>) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    this.consumer?.setMessageHandler(handler);
  }
}

export default RabbitMqClient.getInstance();
