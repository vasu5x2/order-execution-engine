jest.mock("../src/dex/mockDexRouter", () => ({
  MockDexRouter: class {
    async routeBest() {
      throw new Error("router_failed");
    }
  }
}));

jest.mock("../src/db/prisma", () => ({
  prisma: {
    order: {
      findUnique: jest.fn(async () => ({
        id: "o2",
        status: "pending",
        tokenIn: "SOL",
        tokenOut: "USDC",
        amountIn: "1",
        slippageBps: 50
      })),
      update: jest.fn(async () => ({}))
    }
  }
}));

jest.mock("../src/services/orderProgress", () => ({
  setStatus: jest.fn(async () => undefined),
  setConfirmed: jest.fn(async () => undefined),
  setFailedFinal: jest.fn(async () => undefined)
}));

jest.mock("../src/redis/activeOrders", () => ({
  markOrderActive: jest.fn(async () => undefined),
  unmarkOrderActive: jest.fn(async () => undefined)
}));

jest.mock("../src/services/routingLog", () => ({
  logRoutingDecision: jest.fn(() => undefined)
}));

import { handleOrderJob } from "../src/workers/orderWorker";
import { setFailedFinal } from "../src/services/orderProgress";

describe("worker retry behavior", () => {
  test("does NOT persist failed status on non-final attempts", async () => {
    const job: any = {
      name: "execute-market-order",
      data: { orderId: "o2" },
      opts: { attempts: 3 },
      attemptsMade: 0 // attemptNumber=1 (not final)
    };

    await expect(handleOrderJob(job)).rejects.toThrow("router_failed");
    expect(setFailedFinal).toHaveBeenCalledTimes(0);
  });
});
