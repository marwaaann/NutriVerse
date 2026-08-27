import logger from "../config/logger";
import redis from "../config/redis";
import { ITokenStore } from "../interface/IRedisHelper";

export class RedisHelper implements ITokenStore{

  // set key with expiry (in seconds)
  async setItem<T>(key: string,value: T,expiryInSeconds?: number): Promise<void> {

    try {

        const stringValue =typeof value === "string" ? value : JSON.stringify(value);

        if (expiryInSeconds) {
           await redis.set(key, stringValue, "EX", expiryInSeconds);
        } else {
           await redis.set(key, stringValue);
        }

    } catch (error) {
        logger.error("Redis SET Error", error)
        throw new Error("Redis set failed")
    }

  }

  // get value
  async getItem<T>(key: string): Promise<T | null> {
    try{
        const data = await redis.get(key);
        if (!data) return null;
        try {
            return JSON.parse(data) as T;
        } catch {
            return data as T;
        }
    }catch(error){
        logger.error("Redis GET Error", error)
        throw new Error("Redis get failed");
    }
  }

  // delete key
  async deleteItem(key: string): Promise<void> {
    try{
        await redis.del(key);
    }catch(error){
        logger.error("Redis DEL Error", error)
        throw new Error("Redis delete failed");
    }
    
  }

}

