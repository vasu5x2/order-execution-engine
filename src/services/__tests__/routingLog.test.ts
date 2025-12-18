import { logRoutingDecision } from "../routingLog";
import { spyOnConsoleLog } from "../../../tests/spyConsole";

describe("logRoutingDecision", () => {
  test("logs a single structured JSON line containing routing_decision", () => {
    const spy = spyOnConsoleLog();

    logRoutingDecision({
      orderId: "o1",
      tokenIn: "SOL",
      tokenOut: "USDC",
      amountIn: 1,
      chosenDex: "meteora",
      raydiumExpectedOut: 10,
      meteoraExpectedOut: 11,
      reason: "better_expected_out"
    });

    expect(spy.calls.length).toBeGreaterThan(0);

    const last = spy.calls[spy.calls.length - 1]?.[0];
    const obj = JSON.parse(String(last));

    expect(obj.msg).toBe("routing_decision");
    expect(obj.orderId).toBe("o1");
    expect(obj.chosenDex).toBe("meteora");

    spy.restore();
  });
});
