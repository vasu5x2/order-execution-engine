import { FastifyInstance } from "fastify";
import { getLatestOrderEvent, orderChannel } from "../redis/redis";
import { createSubscriber } from "../redis/subscriberFactory";

export async function wsRoutes(app: FastifyInstance) {
  app.get("/ws/orders/:orderId", { websocket: true }, async (connection, req) => {
    const orderId = (req.params as any).orderId as string;

    // Send snapshot first (reconnect-friendly)
    const latest = await getLatestOrderEvent(orderId);
    connection.send(JSON.stringify({ kind: "snapshot", event: latest ?? null }));

    const channel = orderChannel(orderId);

    const sub = createSubscriber();

    const onMessage = (_ch: string, message: string) => {
      connection.send(JSON.stringify({ kind: "event", event: JSON.parse(message) }));
    };

    await sub.subscribe(channel);
    sub.on("message", onMessage);

    connection.on("close", async () => {
      sub.off("message", onMessage);
      try {
        await sub.unsubscribe(channel);
      } finally {
        await sub.quit();
      }
    });
  });
}
