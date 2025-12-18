import { FastifyInstance } from "fastify";
import { listActiveOrders } from "../redis/activeOrders";

export async function activeRoutes(app: FastifyInstance) {
  app.get("/api/orders/active", async () => {
    const ids = await listActiveOrders();
    return { activeCount: ids.length, orderIds: ids };
  });
}
