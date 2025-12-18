import IORedis from "ioredis";
import { env } from "../config/env";

export const redis = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null
});

// Dedicated connection for publish (subscriber is now per WS connection)
export const redisPub = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });

export type OrderEvent =
  | { type: "pending"; orderId: string; ts: number; seq: number }
  | { type: "routing"; orderId: string; ts: number; seq: number }
  | { type: "building"; orderId: string; ts: number; seq: number }
  | { type: "submitted"; orderId: string; ts: number; seq: number }
  | {
      type: "confirmed";
      orderId: string;
      ts: number;
      seq: number;
      txHash: string;
      executedPrice: number;
      chosenDex: "raydium" | "meteora";
    }
  | { type: "failed"; orderId: string; ts: number; seq: number; error: string };

export function orderChannel(orderId: string) {
  return `order:${orderId}`;
}

function orderSeqKey(orderId: string) {
  return `order:seq:${orderId}`;
}

async function nextSeq(orderId: string): Promise<number> {
  const n = await redis.incr(orderSeqKey(orderId));
  // keep counters from living forever in dev
  await redis.expire(orderSeqKey(orderId), 60 * 60);
  return n;
}

export async function publishOrderEvent(event: Omit<OrderEvent, "seq">) {
  const channel = orderChannel(event.orderId);
  const seq = await nextSeq(event.orderId);

  const withSeq = { ...event, seq } as OrderEvent;

  // store latest snapshot (so reconnects can get current state)
  await redis.set(`order:state:${event.orderId}`, JSON.stringify(withSeq), "EX", 60 * 60);

  await redisPub.publish(channel, JSON.stringify(withSeq));
}

export async function getLatestOrderEvent(orderId: string): Promise<OrderEvent | null> {
  const raw = await redis.get(`order:state:${orderId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrderEvent;
  } catch {
    return null;
  }
}
