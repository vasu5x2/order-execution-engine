import { prisma } from "../db/prisma";
import { OrderEvent, publishOrderEvent } from "../redis/redis";

export async function setStatus(orderId: string, status: "pending" | "routing" | "building" | "submitted") {
  await prisma.order.update({
    where: { id: orderId },
    data: { status }
  });

  await publishOrderEvent({ type: status, orderId, ts: Date.now() });
}

export async function setConfirmed(args: {
  orderId: string;
  txHash: string;
  executedPrice: number;
  chosenDex: "raydium" | "meteora";
}) {
  await prisma.order.update({
    where: { id: args.orderId },
    data: {
      status: "confirmed",
      txHash: args.txHash,
      executedPrice: String(args.executedPrice),
      chosenDex: args.chosenDex
    }
  });

  await publishOrderEvent({
    type: "confirmed",
    orderId: args.orderId,
    ts: Date.now(),
    txHash: args.txHash,
    executedPrice: args.executedPrice,
    chosenDex: args.chosenDex
  } as Omit<OrderEvent, "seq">);
}

export async function setFailedFinal(orderId: string, error: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "failed",
      errorReason: error
    }
  });

  await publishOrderEvent({
    type: "failed",
    orderId,
    ts: Date.now(),
    errorReason: error
  } as Omit<OrderEvent, "seq">);
}
