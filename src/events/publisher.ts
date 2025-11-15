import amqp from 'amqplib';

export class RabbitMQPublisher {
  private static ch: any;
  private static conn: any;
  private static isInitialized: boolean = false;

  static async initialize(channel: any) {
    this.ch = channel;
    this.isInitialized = true;
  }

  private static async ensureInitialized() {
    if (!this.isInitialized) {
      try {
        const RABBIT_URL = process.env.RABBIT_URL || 'amqp://localhost';
        this.conn = await amqp.connect(RABBIT_URL);
        this.ch = await this.conn.createChannel();

        // Assert the exchange
        await this.ch.assertExchange('retro.routes', 'topic', {
          durable: true,
        });

        this.isInitialized = true;
        console.log('✅ RabbitMQ Publisher auto-initialized');
      } catch (error) {
        console.error('❌ Failed to auto-initialize RabbitMQ Publisher:', error);
        throw error;
      }
    }
  }

  static async publish(routingKey: string, data: any): Promise<void> {
    await this.ensureInitialized();

    if (!this.ch) {
      throw new Error(
        'RabbitMQ channel not initialized. Call RabbitMQPublisher.initialize(channel) first.'
      );
    }

    try {
      const message = Buffer.from(JSON.stringify(data));
      const published = this.ch.publish('retro.routes', routingKey, message, {
        persistent: true,
        messageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      });

      if (!published) {
        console.warn(
          'Publish returned false (internal buffer full) — message queued in client buffer'
        );
      }

      console.log(`✅ Published message to ${routingKey}`);
    } catch (error) {
      console.error(`❌ Failed to publish to ${routingKey}:`, error);
      throw error;
    }
  }

  static async close() {
    try {
      if (this.ch && typeof this.ch.close === 'function') {
        await this.ch.close();
      }
      if (this.conn && typeof this.conn.close === 'function') {
        await this.conn.close();
      }
      this.isInitialized = false;
      console.log('✅ RabbitMQ Publisher connection closed');
    } catch (error) {
      console.error('❌ Error closing RabbitMQ Publisher:', error);
    }
  }
}
