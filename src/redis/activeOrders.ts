import { redis } from "./redis";

const ACTIVE_SET_KEY = "orders:active";

export async function markOrderActive(orderId: string) {
  await redis.sadd(ACTIVE_SET_KEY, orderId);
  // keep the set from growing forever in dev (optional)
  await redis.expire(ACTIVE_SET_KEY, 60 * 60);
}

export async function unmarkOrderActive(orderId: string) {
  await redis.srem(ACTIVE_SET_KEY, orderId);
}

export async function listActiveOrders(): Promise<string[]> {
  return redis.smembers(ACTIVE_SET_KEY);
}
