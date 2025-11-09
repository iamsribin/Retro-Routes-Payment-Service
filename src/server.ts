import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { startGrpcServer } from './grpc/server';
import { isEnvDefined } from './utils/envChecker';
import { connectDB } from '@Pick2Me/shared';

// server
const startServer = async () => {
  try {
    // check all env are defined
    isEnvDefined();

    // connect to db
    connectDB(process.env.MONGO_URL!);

    //start rabbit consumer
    // consumer.start()

    // start grpc server
    startGrpcServer();

    //listen to port
    app.listen(process.env.PORT, () =>
      console.log(`payment service running on port ${process.env.PORT}`)
    );
  } catch (err: unknown) {
    console.log(err);
  }
};

startServer();
