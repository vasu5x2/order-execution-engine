import { MockDexRouter } from "../mockDexRouter";

describe("MockDexRouter.routeBest", () => {
  test("chooses the venue with higher expectedOut", async () => {
    const router = new MockDexRouter();

    // Force deterministic Math.random sequence:
    // Raydium price factor uses: 0.98 + r*0.04
    // Meteora price factor uses: 0.97 + r*0.05
    // We’ll set Raydium to low, Meteora to high.
    const seq = [0.0, 1.0];
    const spy = jest.spyOn(Math, "random").mockImplementation(() => {
      const v = seq.shift();
      return typeof v === "number" ? v : 0.5;
    });

    const decision = await router.routeBest("SOL", "USDC", 10);

    expect(decision.raydium.expectedOut).toBeLessThan(decision.meteora.expectedOut);
    expect(decision.chosenDex).toBe("meteora");

    spy.mockRestore();
  });
});
