import nextEnv from "@next/env";
import { defineConfig } from "drizzle-kit";
nextEnv.loadEnvConfig(process.cwd());
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: (process.env.DATABASE_URL ?? "./data/zaraff.sqlite").replace(
      /^file:/,
      "",
    ),
  },
});
