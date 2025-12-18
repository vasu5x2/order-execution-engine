import { z } from "zod";

export const OrderStatus = z.enum([
  "pending",
  "routing",
  "building",
  "submitted",
  "confirmed",
  "failed"
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const DexVenue = z.enum(["raydium", "meteora"]);
export type DexVenue = z.infer<typeof DexVenue>;

export const ExecuteOrderRequestSchema = z.object({
  // For mock, keep these as simple strings (e.g., "SOL", "USDC", or mint addresses later)
  tokenIn: z.string().min(2),
  tokenOut: z.string().min(2),

  // amount in "human units" for mock (we'll treat as Decimal in DB)
  amountIn: z.number().positive(),

  // 50 bps = 0.50%
  slippageBps: z.number().int().min(1).max(5000).optional().default(50)
});

export type ExecuteOrderRequest = z.infer<typeof ExecuteOrderRequestSchema>;
