type OrderRow = {
  id: string;
  orderType: "market";
  status: "pending" | "routing" | "building" | "submitted" | "confirmed" | "failed";
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageBps: number;
  chosenDex: string | null;
  quotes: any | null;
  executedPrice: string | null;
  txHash: string | null;
  errorReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function makeFakePrisma() {
  const orders = new Map<string, OrderRow>();

  return {
    __orders: orders,

    order: {
      async create({ data }: any) {
        const id = cryptoRandomId();
        const now = new Date();
        const row: OrderRow = {
          id,
          orderType: data.orderType ?? "market",
          status: data.status ?? "pending",
          tokenIn: data.tokenIn,
          tokenOut: data.tokenOut,
          amountIn: String(data.amountIn),
          slippageBps: data.slippageBps ?? 50,
          chosenDex: data.chosenDex ?? null,
          quotes: data.quotes ?? null,
          executedPrice: data.executedPrice ?? null,
          txHash: data.txHash ?? null,
          errorReason: data.errorReason ?? null,
          createdAt: now,
          updatedAt: now
        };
        orders.set(id, row);
        return row;
      },

      async findUnique({ where }: any) {
        return orders.get(where.id) ?? null;
      },

      async update({ where, data }: any) {
        const row = orders.get(where.id);
        if (!row) throw new Error("Order not found in fake prisma");
        const updated: OrderRow = {
          ...row,
          ...data,
          amountIn: data.amountIn !== undefined ? String(data.amountIn) : row.amountIn,
          executedPrice: data.executedPrice !== undefined ? String(data.executedPrice) : row.executedPrice,
          updatedAt: new Date()
        };
        orders.set(where.id, updated);
        return updated;
      }
    }
  };
}

function cryptoRandomId(): string {
  // lightweight uuid-ish for tests without deps
  return (
    "t_" +
    Math.random().toString(16).slice(2) +
    Math.random().toString(16).slice(2)
  ).slice(0, 36);
}
