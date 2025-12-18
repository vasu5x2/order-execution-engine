// Force router to throw so job fails
jest.mock("../src/dex/mockDexRouter", () => ({
  MockDexRouter: class {
    async routeBest() {
      throw new Error("router_failed");
    }
  }
}));

// Avoid touching real DB
jest.mock("../src/db/prisma", () => ({
  prisma: {
    order: {
      findUnique: jest.fn(async () => ({
        id: "o1",
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

describe("worker final failure behavior", () => {
  test("persists failed status ONLY on final attempt", async () => {
    const job: any = {
      name: "execute-market-order",
      data: { orderId: "o1" },
      opts: { attempts: 3 },
      attemptsMade: 2 // means attemptNumber=3 (final)
    };

    await expect(handleOrderJob(job)).rejects.toThrow("router_failed");
    expect(setFailedFinal).toHaveBeenCalledTimes(1);
    expect((setFailedFinal as any).mock.calls[0][0]).toBe("o1");
  });
});
