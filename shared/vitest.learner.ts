import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["../workshops/context-engineering/starters/ts/learner.test.ts"],
    testTimeout: 20000,
  },
});
