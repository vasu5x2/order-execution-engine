import { FastifyInstance } from "fastify";

export async function recentRoutes(app: FastifyInstance) {
  app.get("/api/orders/recent", async (req, reply) => {
    const limitRaw = (req.query as any)?.limit;
    const limit = Math.max(1, Math.min(100, Number(limitRaw ?? 20)));

    const rows = await app.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return reply.send({
      limit,
      orders: rows.map((o: { id: any; status: any; orderType: any; tokenIn: any; tokenOut: any; amountIn: any; slippageBps: any; chosenDex: any; txHash: any; executedPrice: any; errorReason: any; createdAt: any; }) => ({
        id: o.id,
        status: o.status,
        orderType: o.orderType,
        tokenIn: o.tokenIn,
        tokenOut: o.tokenOut,
        amountIn: Number(o.amountIn),
        slippageBps: o.slippageBps,
        chosenDex: o.chosenDex,
        txHash: o.txHash,
        executedPrice: o.executedPrice ? Number(o.executedPrice) : null,
        errorReason: o.errorReason,
        createdAt: o.createdAt
      }))
    });
  });
}
