// import Redis from "ioredis";
// import { RedisDriverDetails } from "../types/driver";
// const REDIS_URL = (process.env.REDIS_URL) as string

// export const redis = new Redis(REDIS_URL);

// export const GEO_KEY = "onlineDrivers:geo";
// export const HEARTBEAT_PREFIX = "driver:heartbeat:";
// export const LOCK_PREFIX = "lock:booking:";
// export const ONLINE_DRIVER_DETAILS_PREFIX = ":onlineDriver:details:";
// export const RIDE_DRIVER_DETAILS_PREFIX = ":rideDriver:details:";



//  class RedisRepository{
// async getDriverDetails(driverId: string, isOnRide = false): Promise<any | null> {
//     try {
//       const prefix = isOnRide ? RIDE_DRIVER_DETAILS_PREFIX : ONLINE_DRIVER_DETAILS_PREFIX;
//       const details = await redis.get(`${prefix}${driverId}`);
//       return details ? JSON.parse(details) : null;
//     } catch (error) {
//       console.error("Error getting driver details:", error);
//       throw new Error(`Failed to get driver details: ${(error as Error).message}`);
//     }
//   }
// }


// export const redisRepo = new RedisRepository()