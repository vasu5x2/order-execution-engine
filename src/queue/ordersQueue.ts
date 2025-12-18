import { Queue } from "bullmq";
import { redis } from "../redis/redis";

export const ORDERS_QUEUE_NAME = "orders-execution";

export const ordersQueue = new Queue(ORDERS_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 500 // ms (BullMQ will exponentiate per attempt)
    },
    removeOnComplete: 1000,
    removeOnFail: 2000
  }
});

export type ExecuteOrderJob = {
  orderId: string;
};
