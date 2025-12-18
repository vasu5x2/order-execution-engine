jest.mock("../../redis/redis", () => ({
  redis: {
    sadd: jest.fn(async () => 1),
    srem: jest.fn(async () => 1),
    smembers: jest.fn(async () => ["x1", "x2"]),
    expire: jest.fn(async () => 1)
  }
}));

import { listActiveOrders, markOrderActive, unmarkOrderActive } from "../activeOrders";
import { redis } from "../redis";

describe("activeOrders redis set helpers", () => {
  test("markOrderActive adds to set", async () => {
    await markOrderActive("x1");
    expect((redis.sadd as any).mock.calls[0][1]).toBe("x1");
  });

  test("unmarkOrderActive removes from set", async () => {
    await unmarkOrderActive("x1");
    expect((redis.srem as any).mock.calls[0][1]).toBe("x1");
  });

  test("listActiveOrders returns members", async () => {
    const ids = await listActiveOrders();
    expect(ids).toEqual(["x1", "x2"]);
  });
});
