import { FastifyInstance } from "fastify";
import { ExecuteOrderRequestSchema } from "../types/order";
import { ordersQueue } from "../queue/ordersQueue";
import { publishOrderEvent } from "../redis/redis";

export async function ordersRoutes(app: FastifyInstance) {
  app.post("/api/orders/execute", async (req, reply) => {
    const parsed = ExecuteOrderRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        details: parsed.error.flatten()
      });
    }

    const { tokenIn, tokenOut, amountIn, slippageBps } = parsed.data;

    const order = await app.prisma.order.create({
      data: {
        tokenIn,
        tokenOut,
        amountIn: String(amountIn),
        slippageBps,
        status: "pending",
        orderType: "market"
      }
    });

    await publishOrderEvent({ type: "pending", orderId: order.id, ts: Date.now() });

    await ordersQueue.add("execute-market-order", { orderId: order.id });

    return reply.code(200).send({
      orderId: order.id,
      wsUrl: `/ws/orders/${order.id}`
    });
  });

  app.get("/api/orders/:orderId", async (req, reply) => {
    const orderId = (req.params as any).orderId as string;

    const order = await app.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return reply.code(404).send({ error: "NOT_FOUND", orderId });
    }

    return reply.send({
      id: order.id,
      orderType: order.orderType,
      status: order.status,
      tokenIn: order.tokenIn,
      tokenOut: order.tokenOut,
      amountIn: Number(order.amountIn),
      slippageBps: order.slippageBps,
      chosenDex: order.chosenDex,
      quotes: order.quotes,
      executedPrice: order.executedPrice ? Number(order.executedPrice) : null,
      txHash: order.txHash,
      errorReason: order.errorReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    });
  });
}
