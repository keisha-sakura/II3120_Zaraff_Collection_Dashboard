import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema.ts";

export function openDatabase(
  filename = process.env.DATABASE_URL ?? "./data/zaraff.sqlite",
) {
  const path =
    filename === ":memory:"
      ? filename
      : resolve(filename.replace(/^file:/, ""));
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  return { sqlite, orm: drizzle(sqlite, { schema }), path };
}
export type DatabaseContext = ReturnType<typeof openDatabase>;
const globalDb = globalThis as typeof globalThis & {
  zaraffDb?: DatabaseContext;
};
export function database() {
  return (globalDb.zaraffDb ??= openDatabase());
}
