jest.mock("../src/redis/activeOrders", () => ({
  listActiveOrders: jest.fn(async () => ["a", "b", "c"])
}));

import { buildTestApp } from "./helpers/buildTestApp";
import { makeFakePrisma } from "./fakes/fakePrisma";

describe("GET /api/orders/active", () => {
  test("returns active orders from redis set", async () => {
    const app = await buildTestApp();
    (app as any).prisma = makeFakePrisma();

    const res = await app.inject({ method: "GET", url: "/api/orders/active" });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.activeCount).toBe(3);
    expect(body.orderIds).toEqual(["a", "b", "c"]);

    await app.close();
  });
});
