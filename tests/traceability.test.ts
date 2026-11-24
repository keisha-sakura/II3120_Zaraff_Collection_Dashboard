import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("traceability", () => {
  it("tracks all 40 functional requirements to a route and service", () => {
    const traceability = fs.readFileSync(path.resolve(__dirname, "../docs/traceability.md"), "utf8");
    const rows = traceability.split("\n").filter((row) =>
      /^\| FR-\d{2} \|/.test(row) && row.includes("/api/") && /\| (?:S\d+|shared)/.test(row),
    );
    expect(new Set(rows.map((row) => row.match(/^\| FR-(\d{2})/)![1])).size).toBe(40);
    expect(traceability).toContain("Tracked: **40 / 40 FR**");
  });
});
