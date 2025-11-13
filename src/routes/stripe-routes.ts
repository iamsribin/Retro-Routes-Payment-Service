import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const fastify: FastifyInstance = Fastify();

// Example route registration
fastify.register(async (instance: FastifyInstance) => {
  instance.addHook(
    'preHandler',
    instance.verifyGatewayJwt(true, process.env.GATEWAY_SHARED_SECRET!)
  );

  instance.get('/protected', async (request: FastifyRequest, reply: FastifyReply) => {
    // ✅ fully typed
    return { user: request.gatewayUser };
  });
});

export default fastify;

export function StripeWebhook() {}
