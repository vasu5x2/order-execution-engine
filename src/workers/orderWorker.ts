import { Worker, Job } from "bullmq";
import { ORDERS_QUEUE_NAME, ExecuteOrderJob } from "../queue/ordersQueue";
import { redis } from "../redis/redis";
import { prisma } from "../db/prisma";
import { MockDexRouter } from "../dex/mockDexRouter";
import { setConfirmed, setFailedFinal, setStatus } from "../services/orderProgress";
import { markOrderActive, unmarkOrderActive } from "../redis/activeOrders";
import { logRoutingDecision } from "../services/routingLog";
import { sleep } from "../utils/sleep";

const router = new MockDexRouter();

async function processExecuteMarket(job: Job<ExecuteOrderJob>) {
  const { orderId } = job.data;

  await markOrderActive(orderId);

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error(`Order not found: ${orderId}`);

    // Idempotency guard for retries
    if (order.status === "confirmed" || order.status === "failed") {
      await unmarkOrderActive(orderId);
      return { skipped: true, status: order.status };
    }

    await setStatus(orderId, "routing");
    await sleep(800);

    const amountIn = Number(order.amountIn);
    const decision = await router.routeBest(order.tokenIn, order.tokenOut, amountIn);

    logRoutingDecision({
      orderId,
      tokenIn: order.tokenIn,
      tokenOut: order.tokenOut,
      amountIn,
      chosenDex: decision.chosenDex,
      raydiumExpectedOut: decision.raydium.expectedOut,
      meteoraExpectedOut: decision.meteora.expectedOut,
      reason: decision.reason
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        chosenDex: decision.chosenDex,
        quotes: {
          raydium: decision.raydium,
          meteora: decision.meteora,
          reason: decision.reason
        }
      }
    });

    await setStatus(orderId, "building");
    await sleep(800);
    await setStatus(orderId, "submitted");
    await sleep(800);

    const quoted = decision.chosenDex === "raydium" ? decision.raydium : decision.meteora;

    const swap = await router.executeSwap({
      dex: decision.chosenDex,
      amountIn,
      slippageBps: order.slippageBps,
      quotedPrice: quoted.price
    });

    await setConfirmed({
      orderId,
      txHash: swap.txHash,
      executedPrice: swap.executedPrice,
      chosenDex: decision.chosenDex
    });

    await unmarkOrderActive(orderId);

    return {
      chosenDex: decision.chosenDex,
      txHash: swap.txHash,
      executedPrice: swap.executedPrice
    };
  } catch (err) {
    // NOTE: do NOT unmark active here if a retry will happen
    throw err;
  }
}

export async function handleOrderJob(job: Job<ExecuteOrderJob>) {
  try {
    if (job.name === "execute-market-order") {
      return await processExecuteMarket(job);
    }
    throw new Error(`Unknown job name: ${job.name}`);
  } catch (err: any) {
    // Emit "failed" ONLY after final attempt + persist reason
    const attemptsAllowed = job.opts.attempts ?? 1;
    const attemptNumber = job.attemptsMade + 1; // current attempt (1-based)

    if (attemptNumber >= attemptsAllowed) {
      const msg = err?.message ? String(err.message) : "Unknown error";
      await setFailedFinal(job.data.orderId, msg);
      await unmarkOrderActive(job.data.orderId);
    }

    throw err;
  }
}

export function startOrderWorker() {
  const worker = new Worker<ExecuteOrderJob>(ORDERS_QUEUE_NAME, handleOrderJob, {
    connection: redis,
    concurrency: 2
  });

  worker.on("completed", (job, result) => {
    // eslint-disable-next-line no-console
    console.log(`[worker] completed orderId=${job.data.orderId} result=${JSON.stringify(result)}`);
  });

  worker.on("failed", (job, err) => {
    // eslint-disable-next-line no-console
    console.log(
      `[worker] failed orderId=${job?.data?.orderId} attemptsMade=${job?.attemptsMade} error=${err?.message}`
    );
  });

  return worker;
}
