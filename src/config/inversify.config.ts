import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../types/inversify-types';
import { GrpcPaymentController } from '../controllers/grpc-payment-controller';

const container = new Container();

container.bind(TYPES.GrpcPaymentController).to(GrpcPaymentController)

export {container}