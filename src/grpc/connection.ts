import { bookingProto,driverProto } from "@Pick2Me/shared";
import * as grpc from "@grpc/grpc-js";

const driverClient = new (driverProto as any).UserService(
    process.env.GRPC_URL,
    grpc.credentials.createInsecure()
);

const bookingClient = new (bookingProto as any).UserService(
    process.env.GRPC_URL,
    grpc.credentials.createInsecure()
);

export { driverClient,  bookingClient};