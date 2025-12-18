import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { env } from "./config/env";
import { prisma } from "./db/prisma";
import { ordersRoutes } from "./routes/orders";
import { wsRoutes } from "./routes/ws";
import { activeRoutes } from "./routes/active";
import { recentRoutes } from "./routes/recent";
import { redis, redisPub } from "./redis/redis";

export async function buildApp() {
  const app = Fastify({
    logger:
      env.nodeEnv === "development"
        ? {
            transport: {
              target: "pino-pretty",
              options: { colorize: true, translateTime: "SYS:standard" }
            }
          }
        : true
  });

  await app.register(websocket);

  app.decorate("prisma", prisma);

  app.get("/health", async () => {
    return { ok: true, service: "order-execution-engine", env: env.nodeEnv };
  });

  await app.register(ordersRoutes);
  await app.register(activeRoutes);
  await app.register(recentRoutes);
  await app.register(wsRoutes);

  app.addHook("onClose", async (instance) => {
    instance.log.info("shutting_down");
    await prisma.$disconnect();
    await Promise.allSettled([redis.quit(), redisPub.quit()]);
  });

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}
