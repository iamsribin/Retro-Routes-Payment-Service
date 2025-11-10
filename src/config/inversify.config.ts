import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../types/inversify-types';
import { GrpcPaymentController } from '../controllers/grpc-payment-controller';
import { GrpcPaymentService } from '@/services/implementation/grpc-payment-service';
import { IGrpcPaymentService } from '@/services/interface/i-grpc-payment-service';

const container = new Container();

container.bind<GrpcPaymentController>(TYPES.GrpcPaymentController).to(GrpcPaymentController)
container.bind<IGrpcPaymentService>(TYPES.GrpcPaymentService).to(GrpcPaymentService)

export {container}