import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts", "../workshops/context-engineering/starters/ts/smoke.test.ts"],
    testTimeout: 20000,
  },
});
