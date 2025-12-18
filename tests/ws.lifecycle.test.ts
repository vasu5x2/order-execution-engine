jest.mock("../src/redis/redis", () => {
  const actual = jest.requireActual("../src/redis/redis");
  return {
    ...actual,
    getLatestOrderEvent: jest.fn(async (orderId: string) => ({
      type: "pending",
      orderId,
      ts: 1700000000000,
      seq: 1
    }))
  };
});

import WebSocket from "ws";
import { buildTestApp } from "./helpers/buildTestApp";
import { makeFakePrisma } from "./fakes/fakePrisma";
import { FakeSubscriber } from "./fakes/fakeSubscriber";
import { orderChannel } from "../src/redis/redis";

const fakeSub = new FakeSubscriber();

// Mock subscriber factory so WS route uses our fake pub/sub
jest.mock("../src/redis/subscriberFactory", () => ({
  createSubscriber: () => fakeSub
}));

function waitForMessage(ws: WebSocket): Promise<any> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout waiting for ws message")), 2000);
    ws.once("message", (data: any) => {
      clearTimeout(t);
      resolve(JSON.parse(String(data)));
    });
  });
}

describe("WebSocket lifecycle", () => {
  test("sends snapshot then streams pubsub events", async () => {
    const app = await buildTestApp();
    (app as any).prisma = makeFakePrisma();

    await app.listen({ port: 0, host: "127.0.0.1" });
    const addr = app.server.address();
    if (!addr || typeof addr === "string") throw new Error("failed to bind test server");
    const port = addr.port;

    const orderId = "order_test_1";
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/orders/${orderId}`);

    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", reject);
    });

    // 1) snapshot message
    const snap = await waitForMessage(ws);
    expect(snap.kind).toBe("snapshot");
    expect(snap.event.type).toBe("pending");
    expect(snap.event.orderId).toBe(orderId);
    expect(snap.event.seq).toBe(1);

    // 2) simulate redis pubsub event
    const ch = orderChannel(orderId);
    const routingEvent = {
      type: "routing",
      orderId,
      ts: Date.now(),
      seq: 2
    };
    fakeSub.emit("message", ch, JSON.stringify(routingEvent));

    const ev = await waitForMessage(ws);
    expect(ev.kind).toBe("event");
    expect(ev.event.type).toBe("routing");
    expect(ev.event.seq).toBe(2);

    ws.close();
    await app.close();
  });
});
