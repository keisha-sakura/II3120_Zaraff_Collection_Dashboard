import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("traceability", () => {
  it("resolves all 40 FR to existing route methods and service implementations", () => {
    const root = path.resolve(__dirname, "..");
    const text = fs.readFileSync(
      path.join(root, "docs/traceability.md"),
      "utf8",
    );
    const rows = text.split("\n").filter((row) => /^\| FR-\d{2} \|/.test(row));
    expect(rows).toHaveLength(40);
    for (let number = 1; number <= 40; number += 1) {
      const id = `FR-${String(number).padStart(2, "0")}`;
      const row = rows.find((entry) => entry.startsWith(`| ${id} |`));
      expect(row, id).toBeDefined();
      const endpoints = [
        ...row!.matchAll(/`(GET|POST|PATCH|PUT|DELETE) (\/api\/[^ `]+)`/g),
      ];
      expect(endpoints.length, id).toBeGreaterThan(0);
      for (const [, method, endpoint] of endpoints) {
        const relative = endpoint
          .replace(/^\/api\//, "")
          .replace(/:([A-Za-z]+)/g, "[$1]")
          .replace("items/[kode]", "items/[id]");
        const file = path.join(root, "src/app/api", relative, "route.ts");
        expect(fs.existsSync(file), `${id}: ${file}`).toBe(true);
        expect(fs.readFileSync(file, "utf8"), id).toMatch(
          new RegExp(`export async function ${method}\\b`),
        );
      }
      for (const match of row!
        .split("|")
        .at(-2)!
        .matchAll(/\bS(\d+)\b/g)) {
        const service = fs
          .readdirSync(path.join(root, "services"))
          .find((entry) => entry.startsWith(`s${match[1]}-`));
        expect(service, id).toBeDefined();
        expect(
          fs.existsSync(path.join(root, "services", service!, "service.ts")),
          id,
        ).toBe(true);
      }
      if (row!.includes("shared auth"))
        expect(fs.existsSync(path.join(root, "lib/auth.ts"))).toBe(true);
      if (row!.includes("shared audit"))
        expect(
          fs.existsSync(path.join(root, "services/audit/service.ts")),
        ).toBe(true);
    }
    console.info("FR terlacak", { terlacak: rows.length, total: 40 });
  });
});
