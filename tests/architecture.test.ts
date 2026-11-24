import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const calls: Record<string, string[]> = {
  "s1-inventory": [], "s2-order": [], "s3-member": [], "s4-payment": [], "s5-shipment": [], "s6-pricing": [], "s7-notification": [],
  "s8-reporting": ["s1-inventory", "s2-order", "s4-payment", "s5-shipment"],
  "s9-promotion": ["s1-inventory", "s7-notification"],
  "s10-live-selling": ["s1-inventory", "s2-order", "s7-notification"],
  "s11-sales-strategy": ["s8-reporting", "s7-notification"],
  "s12-order-fulfillment": ["s1-inventory", "s2-order", "s3-member", "s4-payment", "s5-shipment", "s6-pricing", "s7-notification"],
  audit: [],
};
function files(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}

describe("SOA architecture", () => {
  it("allows only declared service dependencies and no Prisma in dashboard", () => {
    for (const file of files(path.join(root, "services")).filter((value) => value.endsWith(".ts"))) {
      const source = fs.readFileSync(file, "utf8");
      const owner = path.relative(path.join(root, "services"), file).split(path.sep)[0];
      for (const match of source.matchAll(/s\d{1,2}-[a-z-]+/g)) {
        const target = match[0];
        expect(calls[owner] ?? []).toContain(target);
      }
    }
    for (const file of files(path.join(root, "src", "app", "(dashboard)")))
      expect(fs.readFileSync(file, "utf8")).not.toContain("@prisma/client");
  });

  it("keeps StatusLog access in the shared audit repository", () => {
    for (const file of files(path.join(root, "services")).filter((value) => value.endsWith(".ts") && !value.endsWith(path.join("audit", "repository.ts"))))
      expect(fs.readFileSync(file, "utf8")).not.toMatch(/\.statusLog\b/);
  });
});
