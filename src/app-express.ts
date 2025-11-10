import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from '@Pick2Me/shared';

// create app
const app = express();

// middlewares
app.use(express.json());
app.use(cookieParser());

// error handler
app.use(errorHandler);

// export app
export default app;
