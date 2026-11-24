import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canAccessPage,
  canAccessPath,
  getPagesForRole,
  pages,
} from "../src/config/pages.ts";
import { getNavigation, getSearchPages } from "../src/config/navigation.ts";
import { isRole, roles } from "../src/config/roles.ts";

test("all annotated artboards match UI access, with confirmed Live Host override", () => {
  const inventory = JSON.parse(
    readFileSync(
      new URL("../docs/design/inventory.json", import.meta.url),
      "utf8",
    ),
  );
  const labels = {
    owner: "Owner",
    admin: "Admin",
    penyortir: "Penyortir",
    packing: "Tim Packing",
  };
  for (const screen of inventory) {
    assert.ok(
      screen.accessNote,
      `Missing source access annotation: ${screen.file}`,
    );
    assert.ok(
      pages.some((page) => page.id === screen.id),
      `Unmapped design: ${screen.file}`,
    );
    for (const [role, label] of Object.entries(labels)) {
      const expected = screen.id === "M01" || screen.accessNote.includes(label);
      assert.equal(
        canAccessPage(role, screen.id),
        expected,
        `${screen.file}: ${role}`,
      );
    }
  }
});
test("Live Host has only home and live schedule; packing cannot dispatch shipments", () => {
  assert.deepEqual(
    getPagesForRole("live-host").map((page) => page.id),
    ["B05", "P01"],
  );
  assert.deepEqual(
    getNavigation("live-host").map((module) => module.id),
    ["beranda", "penjualan"],
  );
  assert.deepEqual(
    getNavigation("packing").map((module) => module.id),
    ["beranda", "pengiriman"],
  );
  for (const id of ["D03", "D04", "D06", "P07", "G09"])
    assert.equal(canAccessPage("packing", id), false);
});
test("search and tabs never expose a page outside the active role", () => {
  for (const role of roles) {
    const navigation = getNavigation(role);
    assert.ok(navigation.length <= 7);
    for (const page of [
      ...navigation.flatMap((module) => module.tabs),
      ...getSearchPages(role, ""),
    ]) {
      assert.ok(canAccessPage(role, page.id), `${role}: ${page.id}`);
    }
  }
  assert.equal(getSearchPages("penyortir", "Lokasi penyimpanan").length, 0);
  assert.equal(isRole("superadmin"), false);
});
test("path matching handles entity IDs without prefix permission leaks", () => {
  assert.ok(canAccessPath("penyortir", "/gudang/inventaris/ZR-2610-0013"));
  assert.ok(canAccessPath("packing", "/pengiriman/packing/ORD-261121-001"));
  assert.equal(
    canAccessPath("packing", "/pengiriman/siap-dikirim/ORD-261121-001/resi"),
    false,
  );
  assert.equal(
    canAccessPath("live-host", "/penjualan/live/baru/konten"),
    false,
  );
  assert.equal(canAccessPath("penyortir", "/gudang-private"), false);
  assert.equal(canAccessPath("owner", "/unknown"), false);
});
