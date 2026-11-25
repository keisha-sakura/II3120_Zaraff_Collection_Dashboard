import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@backend": path.resolve(__dirname, "."),
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    env: { DATABASE_URL: "file:./test.db?connection_limit=1" },
    fileParallelism: false,
    globalSetup: ["tests/global-setup.ts"],
    sequence: { concurrent: false },
  },
});
