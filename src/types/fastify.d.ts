import "fastify";
import { AccessPayload, IRole } from "@Pick2Me/shared";

declare module "fastify" {
  interface FastifyInstance {
    verifyGatewayJwt: (
      strict?: boolean,
      GATEWAY_SECRET?: string,
      options?: { role?: IRole | IRole[] }
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    gatewayUser?: AccessPayload | null;
  }
}
  