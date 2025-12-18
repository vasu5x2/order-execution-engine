import { buildTestApp } from "./helpers/buildTestApp";
import { makeFakePrisma } from "./fakes/fakePrisma";

describe("Health", () => {
  test("GET /health returns ok", async () => {
    const app = await buildTestApp();
    (app as any).prisma = makeFakePrisma();

    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);

    await app.close();
  });
});

