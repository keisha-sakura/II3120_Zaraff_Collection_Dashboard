// Global setup: re-seed the database once before all test suites run.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { closeSync, openSync } from "node:fs";

export default function setup() {
  const root = path.resolve(__dirname, "..");
  closeSync(openSync(path.join(root, "prisma/test.db"), "a"));
  const env = {
    ...process.env,
    DATABASE_URL: "file:./test.db?connection_limit=1",
  };
  execFileSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"],
    { cwd: root, env, stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"],
    { cwd: root, env, stdio: "inherit" },
  );
}
