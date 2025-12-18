import IORedis from "ioredis";
import { env } from "../config/env";

export type RedisSubscriber = Pick<IORedis, "subscribe" | "unsubscribe" | "on" | "off" | "quit">;

export function createSubscriber(): RedisSubscriber {
  return new IORedis(env.redisUrl, { maxRetriesPerRequest: null });
}
