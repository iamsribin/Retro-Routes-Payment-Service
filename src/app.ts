import Fastify from "fastify";
import cookie from "fastify-cookie";
import errorHandlerPlugin from "@/plugins/errorHandler.plugin";
import walletRoutes from "@/routes/wallet-routes";
import verifyGatewayJwtPlugin from "@/plugins/verifyGatewayJwt.plugin";

const app = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        singleLine: true,
        // ignore: 'pid,hostname,reqId',
      },
    },
  },
  pluginTimeout: 10000,
});

app.register(cookie);

app.register(verifyGatewayJwtPlugin);

app.register(walletRoutes, { prefix: "/" });

app.register(errorHandlerPlugin); 

export default app;
