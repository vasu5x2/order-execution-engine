import { MockDexRouter } from "../mockDexRouter";

describe("MockDexRouter.executeSwap", () => {
  test("throws when slippage exceeds slippageBps", async () => {
    const router = new MockDexRouter();

    // executeSwap uses:
    // slip = Math.random() * 0.008
    // If we return 1.0 => slip=0.008 = 0.8%
    // With slippageBps=50 => 0.5% max => should throw.
    const spy = jest.spyOn(Math, "random").mockReturnValue(1.0);

    await expect(
      router.executeSwap({
        dex: "raydium",
        amountIn: 1,
        slippageBps: 50,
        quotedPrice: 100
      })
    ).rejects.toThrow(/Slippage exceeded/);

    spy.mockRestore();
  });
});
