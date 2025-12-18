const baseUrl = process.argv[2] ?? "http://localhost:3000";
const count = Number(process.argv[3] ?? 100);

type Resp = { orderId: string; wsUrl: string };

async function main() {
  console.log(`Load test: sending ${count} orders to ${baseUrl}`);

  const started = Date.now();
  const results: Resp[] = [];

  const concurrency = 20;
  let i = 0;

  async function worker() {
    while (i < count) {
      const n = i++;
      const body = {
        tokenIn: "SOL",
        tokenOut: "USDC",
        amountIn: 1 + (n % 10) * 0.1,
        slippageBps: 50
      };

      const res = await fetch(`${baseUrl}/api/orders/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`request failed: ${res.status} ${t}`);
      }

      results.push((await res.json()) as Resp);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));

  const ms = Date.now() - started;
  console.log(`Done. Sent ${results.length} orders in ${ms}ms (~${((results.length / ms) * 60000).toFixed(1)} orders/min)`);
  console.log(`Example orderId: ${results[0]?.orderId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
