import { FastifyInstance } from 'fastify';
import rawbody from '../plugins/rawbody';


export function StripeWebhook(fastify: FastifyInstance) {
  fastify.register(rawbody);

  fastify.post('/webhook/stripe',()=>{
    
  });
}