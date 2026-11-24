import nextEnv from "@next/env";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
nextEnv.loadEnvConfig(process.cwd());
const { openDatabase } = await import("../src/server/db.ts");
const ctx = openDatabase();
try {
  const command = process.argv[2];
  if (command === "migrate" || command === "setup")
    migrate(ctx.orm, { migrationsFolder: resolve("drizzle") });
  if (command === "seed" || command === "setup") {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_DEMO_SEED !== "true"
    )
      throw new Error(
        "Seed akun demo produksi dinonaktifkan. Gunakan environment development.",
      );
    const { seedDatabase } = await import("../src/server/seed.ts");
    console.log(
      seedDatabase(ctx)
        ? "Seed berhasil disimpan."
        : "Seed sudah ada; data pengguna tidak diubah.",
    );
  }
  if (command === "backup") {
    mkdirSync("backups", { recursive: true });
    const file = resolve("backups", `zaraff-${Date.now()}.sqlite`);
    await ctx.sqlite.backup(file);
    console.log(`Backup: ${file}`);
  }
  if (command === "reset") {
    if (
      process.env.NODE_ENV === "production" ||
      !process.argv.includes("--confirm-reset")
    )
      throw new Error(
        "Reset hanya untuk development dengan --confirm-reset. Jalankan backup terlebih dahulu.",
      );
    ctx.sqlite.pragma("foreign_keys = OFF");
    const tables = ctx.sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      )
      .all() as { name: string }[];
    ctx.sqlite
      .transaction(() => {
        for (const { name } of tables)
          ctx.sqlite.exec(`DROP TABLE "${name.replaceAll('"', '""')}"`);
      })
      .immediate();
    ctx.sqlite.pragma("foreign_keys = ON");
    migrate(ctx.orm, { migrationsFolder: resolve("drizzle") });
    console.log("Database direset. Jalankan npm run db:seed untuk data awal.");
  }
} finally {
  ctx.sqlite.close();
}
