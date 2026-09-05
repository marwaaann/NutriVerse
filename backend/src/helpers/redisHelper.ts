import logger from "../config/logger";
import redis from "../config/redis";
import { ITokenStore } from "../interface/IRedisHelper";

export class RedisHelper implements ITokenStore {
  private fallbackMap = new Map<string, { value: string; expiry?: number }>();
  private useFallback = false;

  constructor() {
    redis.on("error", (err) => {
      if (!this.useFallback) {
        logger.warn("Redis connection failed. Falling back to in-memory store for sessions.");
        this.useFallback = true;
      }
    });
  }

  // set key with expiry (in seconds)
  async setItem<T>(key: string, value: T, expiryInSeconds?: number): Promise<void> {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);

    if (this.useFallback) {
      const expiry = expiryInSeconds ? Date.now() + expiryInSeconds * 1000 : undefined;
      this.fallbackMap.set(key, { value: stringValue, expiry });
      return;
    }

    try {
      if (expiryInSeconds) {
        await redis.set(key, stringValue, "EX", expiryInSeconds);
      } else {
        await redis.set(key, stringValue);
      }
    } catch (error) {
      logger.warn("Redis SET failed, using in-memory fallback.");
      const expiry = expiryInSeconds ? Date.now() + expiryInSeconds * 1000 : undefined;
      this.fallbackMap.set(key, { value: stringValue, expiry });
    }
  }

  // get value
  async getItem<T>(key: string): Promise<T | null> {
    if (this.useFallback) {
      const item = this.fallbackMap.get(key);
      if (!item) return null;
      if (item.expiry && item.expiry < Date.now()) {
        this.fallbackMap.delete(key);
        return null;
      }
      try {
        return JSON.parse(item.value) as T;
      } catch {
        return item.value as T;
      }
    }

    try {
      const data = await redis.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as T;
      }
    } catch (error) {
      logger.warn("Redis GET failed, using in-memory fallback.");
      const item = this.fallbackMap.get(key);
      if (!item) return null;
      if (item.expiry && item.expiry < Date.now()) {
        this.fallbackMap.delete(key);
        return null;
      }
      try {
        return JSON.parse(item.value) as T;
      } catch {
        return item.value as T;
      }
    }
  }

  // delete key
  async deleteItem(key: string): Promise<void> {
    this.fallbackMap.delete(key);
    if (!this.useFallback) {
      try {
        await redis.del(key);
      } catch (error) {
        logger.error("Redis DEL Error", error);
      }
    }
  }
}
