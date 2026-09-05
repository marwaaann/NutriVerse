import Redis from "ioredis";
import { ENV }
 from "./env";

const redis = new Redis(ENV.REDIS_URL || "redis://127.0.0.1:6379");
console.log("Redis",redis.status)

export default redis;