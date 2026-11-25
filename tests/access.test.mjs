import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessPage,
  canAccessPath,
  getPagesForRole,
  pages,
} from "../src/config/pages.ts";
import { getNavigation, getSearchPages } from "../src/config/navigation.ts";
import { isRole, roles } from "../src/config/roles.ts";

test("every registered page follows the five-role access policy", () => {
  // Product permissions are test fixtures, independent of archived design files.
  const management = ["owner", "admin"];
  const warehouse = [...management, "penyortir"];
  const packing = [...management, "packing"];
  const groups = [
    {
      ids: ["M01"],
      allowed: ["owner", "admin", "penyortir", "live-host", "packing"],
    },
    { ids: ["B01"], allowed: ["owner"] },
    { ids: ["B02"], allowed: ["penyortir"] },
    { ids: ["B03"], allowed: ["admin"] },
    { ids: ["B04"], allowed: ["packing"] },
    { ids: ["B05"], allowed: ["live-host"] },
    {
      ids: ["G01", "G02", "G03", "G04", "G05", "G07", "G08", "G09", "G10"],
      allowed: warehouse,
    },
    { ids: ["P01"], allowed: [...management, "live-host"] },
    {
      ids: [
        "P02",
        "P03",
        "P04",
        "P05",
        "P06",
        "P07",
        "P08",
        "P09",
        "P10",
        "P11",
        "Y01",
        "Y02",
        "Y03",
        "Y05",
        "Y06",
        "D03",
        "D04",
        "D06",
        "R01",
        "R02",
        "R03",
        "R04",
        "R05",
        "R06",
        "R07",
        "S01",
        "S02",
        "S03",
      ],
      allowed: management,
    },
    { ids: ["D01", "D02"], allowed: packing },
  ];
  const expected = groups.flatMap(({ ids, allowed }) =>
    ids.map((id) => ({ id, allowed })),
  );
  assert.equal(new Set(expected.map((page) => page.id)).size, expected.length);
  assert.deepEqual(
    pages.map((page) => page.id).sort(),
    expected.map((page) => page.id).sort(),
  );
  for (const { id, allowed } of expected) {
    for (const role of roles) {
      assert.equal(
        canAccessPage(role, id),
        allowed.includes(role),
        `${id}: ${role}`,
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
  for (const role of ["owner", "admin"])
    assert.ok(canAccessPath(role, "/penjualan/live/live-261128"));
  for (const role of ["live-host", "packing", "penyortir"])
    assert.equal(canAccessPath(role, "/penjualan/live/live-261128"), false);
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
