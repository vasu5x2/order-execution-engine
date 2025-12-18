import { sleep } from "../utils/sleep";

export type DexQuote = {
  dex: "raydium" | "meteora";
  price: number; // tokenOut per tokenIn (mock)
  fee: number;   // fraction, e.g. 0.003
  expectedOut: number; // amountIn * price * (1 - fee)
};

export type RouteDecision = {
  chosenDex: "raydium" | "meteora";
  raydium: DexQuote;
  meteora: DexQuote;
  reason: "better_expected_out";
};

function pseudoBasePrice(tokenIn: string, tokenOut: string): number {
  // deterministic-ish base price per pair (mock)
  const s = `${tokenIn}->${tokenOut}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  // map to [0.5, 200]
  return 0.5 + (h % 19950) / 100;
}

export class MockDexRouter {
  async getRaydiumQuote(tokenIn: string, tokenOut: string, amountIn: number): Promise<DexQuote> {
    await sleep(200);
    const base = pseudoBasePrice(tokenIn, tokenOut);
    const price = base * (0.98 + Math.random() * 0.04); // 0.98x..1.02x
    const fee = 0.003;
    return { dex: "raydium", price, fee, expectedOut: amountIn * price * (1 - fee) };
  }

  async getMeteoraQuote(tokenIn: string, tokenOut: string, amountIn: number): Promise<DexQuote> {
    await sleep(200);
    const base = pseudoBasePrice(tokenIn, tokenOut);
    const price = base * (0.97 + Math.random() * 0.05); // 0.97x..1.02x (slightly wider)
    const fee = 0.002;
    return { dex: "meteora", price, fee, expectedOut: amountIn * price * (1 - fee) };
  }

  async routeBest(tokenIn: string, tokenOut: string, amountIn: number): Promise<RouteDecision> {
    const [raydium, meteora] = await Promise.all([
      this.getRaydiumQuote(tokenIn, tokenOut, amountIn),
      this.getMeteoraQuote(tokenIn, tokenOut, amountIn)
    ]);

    const chosenDex = meteora.expectedOut > raydium.expectedOut ? "meteora" : "raydium";

    return {
      chosenDex,
      raydium,
      meteora,
      reason: "better_expected_out"
    };
  }

  async executeSwap(args: {
    dex: "raydium" | "meteora";
    amountIn: number;
    slippageBps: number;
    quotedPrice: number;
  }): Promise<{ txHash: string; executedPrice: number }> {
    // Simulate 2–3s execution time
    await sleep(2000 + Math.random() * 1000);

    // simulate some execution slippage (0%..0.8%)
    const slip = Math.random() * 0.008;
    const executedPrice = args.quotedPrice * (1 - slip);

    const maxSlip = args.slippageBps / 10_000;
    if (slip > maxSlip) {
      throw new Error(
        `Slippage exceeded: slip=${(slip * 100).toFixed(2)}% > max=${(maxSlip * 100).toFixed(2)}%`
      );
    }

    // occasional random failure (network-ish)
    if (Math.random() < 0.05) {
      throw new Error("Mock network failure while submitting transaction");
    }

    const txHash = `mock_${Math.random().toString(16).slice(2)}${Math.random()
      .toString(16)
      .slice(2)}`.slice(0, 44);

    return { txHash, executedPrice };
  }
}
