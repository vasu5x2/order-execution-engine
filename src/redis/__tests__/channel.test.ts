import { orderChannel } from "../redis";

describe("orderChannel", () => {
  test("creates a stable pubsub channel name", () => {
    expect(orderChannel("abc")).toBe("order:abc");
    expect(orderChannel("order-123")).toBe("order:order-123");
  });
});
