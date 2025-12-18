export function logRoutingDecision(args: {
  orderId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  chosenDex: "raydium" | "meteora";
  raydiumExpectedOut: number;
  meteoraExpectedOut: number;
  reason: string;
}) {
  // One structured log line = easy to show in demo + easy to grep
  // (Later you can swap this to app.log.info if you pass logger through)
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      level: "info",
      msg: "routing_decision",
      ...args
    })
  );
}
