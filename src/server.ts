import { buildApp } from "./app";
import { env } from "./config/env";
import { startOrderWorker } from "./workers/orderWorker";

async function main() {
  const app = await buildApp();

  // Start worker in the same process (fine for this assignment).
  // In production, you’d split API + worker into separate services.
  const worker = startOrderWorker();

  app.addHook("onClose", async () => {
    await worker.close();
  });

  await app.listen({ port: env.port, host: "0.0.0.0" });

  app.log.info(
    {
      port: env.port,
      nodeEnv: env.nodeEnv
    },
    "server_started"
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
