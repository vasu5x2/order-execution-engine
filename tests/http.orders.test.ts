// Mocks MUST come before imports that load the modules.
jest.mock("../src/queue/ordersQueue", () => ({
  ordersQueue: {
    add: jest.fn(async () => ({ id: "job1" }))
  }
}));

jest.mock("../src/redis/redis", () => {
  const actual = jest.requireActual("../src/redis/redis");
  return {
    ...actual,
    publishOrderEvent: jest.fn(async () => undefined),
    // Keep helpers if anything else imports them
    orderChannel: actual.orderChannel,
    getLatestOrderEvent: jest.fn(async () => null)
  };
});

import { makeFakePrisma } from "./fakes/fakePrisma";
import { buildTestApp } from "./helpers/buildTestApp";

describe("HTTP Orders API", () => {
  test("POST /api/orders/execute returns orderId and wsUrl", async () => {
    const app = await buildTestApp();
    const fakePrisma = makeFakePrisma();
    (app as any).prisma = fakePrisma;

    const res = await app.inject({
      method: "POST",
      url: "/api/orders/execute",
      payload: { tokenIn: "SOL", tokenOut: "USDC", amountIn: 1.5, slippageBps: 50 }
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.orderId).toBeTruthy();
    expect(body.wsUrl).toBe(`/ws/orders/${body.orderId}`);

    await app.close();
  });

  test("POST /api/orders/execute rejects invalid payload", async () => {
    const app = await buildTestApp();
    const fakePrisma = makeFakePrisma();
    (app as any).prisma = fakePrisma;

    const res = await app.inject({
      method: "POST",
      url: "/api/orders/execute",
      payload: { tokenIn: "S", tokenOut: "USDC", amountIn: -1 }
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe("VALIDATION_ERROR");

    await app.close();
  });

  test("GET /api/orders/:id returns persisted order", async () => {
    const app = await buildTestApp();
    const fakePrisma = makeFakePrisma();
    (app as any).prisma = fakePrisma;

    // create via API
    const createRes = await app.inject({
      method: "POST",
      url: "/api/orders/execute",
      payload: { tokenIn: "SOL", tokenOut: "USDC", amountIn: 2 }
    });
    const { orderId } = createRes.json();

    const getRes = await app.inject({
      method: "GET",
      url: `/api/orders/${orderId}`
    });

    expect(getRes.statusCode).toBe(200);
    const order = getRes.json();
    expect(order.id).toBe(orderId);
    expect(order.tokenIn).toBe("SOL");
    expect(order.tokenOut).toBe("USDC");
    expect(order.amountIn).toBe(2);

    await app.close();
  });
});
