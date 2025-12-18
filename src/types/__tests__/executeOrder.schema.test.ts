import { ExecuteOrderRequestSchema } from "../order";

describe("ExecuteOrderRequestSchema", () => {
  test("accepts a valid payload and applies default slippageBps", () => {
    const parsed = ExecuteOrderRequestSchema.parse({
      tokenIn: "SOL",
      tokenOut: "USDC",
      amountIn: 1.25
    });

    expect(parsed.slippageBps).toBe(50);
  });

  test("rejects invalid payload", () => {
    const res = ExecuteOrderRequestSchema.safeParse({
      tokenIn: "",
      tokenOut: "USDC",
      amountIn: -1
    });

    expect(res.success).toBe(false);
  });

  test("rejects slippageBps outside bounds", () => {
    const res = ExecuteOrderRequestSchema.safeParse({
      tokenIn: "SOL",
      tokenOut: "USDC",
      amountIn: 1,
      slippageBps: 999999
    });

    expect(res.success).toBe(false);
  });
});
