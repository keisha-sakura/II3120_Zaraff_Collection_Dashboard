// Global setup: re-seed the database once before all test suites run.
import { execSync } from "node:child_process";
import path from "node:path";

export default function setup() {
  const root = path.resolve(__dirname, "..");
  execSync("npx tsx prisma/seed.ts", { cwd: root, stdio: "inherit" });
}
