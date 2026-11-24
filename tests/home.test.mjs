import assert from "node:assert/strict";
import test from "node:test";
import { mockHomeData } from "../src/mocks/data/home.ts";
import { progressPercentage } from "../src/features/beranda/contracts.ts";
import { roles } from "../src/config/roles.ts";
import { mockUsers } from "../src/mocks/data/users.ts";

test("dashboard fixtures cover five roles with role-specific payloads", () => {
  assert.deepEqual(new Set(Object.keys(mockHomeData)), new Set(roles));
  for (const role of roles) {
    assert.equal(mockHomeData[role].role, role);
    assert.ok(mockUsers.some((user) => user.role === role));
  }
  for (const role of ["penyortir", "packing", "live-host"]) {
    assert.equal("income" in mockHomeData[role], false);
    assert.equal("payments" in mockHomeData[role], false);
    assert.equal("orders" in mockHomeData[role], false);
  }
  const host = mockUsers.find((user) => user.role === "live-host");
  for (const live of mockHomeData["live-host"].upcoming) {
    assert.equal(live.hostId, host.id);
    assert.notEqual(live.status, "completed");
  }
  assert.ok(
    mockHomeData.penyortir.note.lines.some((line) =>
      line.startsWith("Penyortir:"),
    ),
  );
  assert.equal(
    mockHomeData.packing.note.lines.some((line) =>
      line.startsWith("Penyortir:"),
    ),
    false,
  );
});

test("count-based progress handles empty workloads, rounding, and over-completion", () => {
  assert.equal(progressPercentage(0, 0), 0);
  assert.equal(progressPercentage(0, 12), 0);
  assert.equal(progressPercentage(1, 3), 33);
  assert.equal(progressPercentage(6, 10), 60);
  assert.equal(progressPercentage(12, 12), 100);
  assert.equal(progressPercentage(15, 12), 100);
});
