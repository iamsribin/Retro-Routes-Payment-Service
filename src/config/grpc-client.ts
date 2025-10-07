import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import "dotenv/config";

const packageDef = protoLoader.loadSync(
  path.resolve(__dirname, "../proto/driver.proto")
);
const grpcObject = grpc.loadPackageDefinition(packageDef) as unknown as any;
const DRIVER_GRPC_PORT = "5004"
const Domain =  "localhost"

const driverClient = new grpcObject.driver_package.Driver(
  `${Domain}:${DRIVER_GRPC_PORT}`,
  grpc.credentials.createInsecure(),
  console.log(`driver server started ${DRIVER_GRPC_PORT}`)
);


//booking
 const bookingPackageDef = protoLoader.loadSync(
  path.resolve(__dirname, "../proto/booking.proto")
);
const bookingGrpcObject = grpc.loadPackageDefinition(bookingPackageDef) as unknown as any;
const BOOKING_GRPC_PORT = "3002"

const bookingClient = new bookingGrpcObject.ride_package.Ride(
  `${Domain}:${BOOKING_GRPC_PORT}`,
  grpc.credentials.createInsecure(),
  console.log(`driver server started ${BOOKING_GRPC_PORT}`)
); 

export { driverClient, bookingClient };