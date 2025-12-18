export async function buildTestApp() {
  // IMPORTANT: imports must happen after jest.mock in test files
  const mod = await import("../../src/app");
  const app = await mod.buildApp();
  return app;
}
