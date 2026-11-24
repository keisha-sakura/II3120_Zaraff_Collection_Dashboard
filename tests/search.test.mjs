import assert from "node:assert/strict";
import test from "node:test";
import { findSearchResults } from "../src/components/layout/search-results.ts";
import { canAccessPath, pages } from "../src/config/pages.ts";
import { roles } from "../src/config/roles.ts";
import { createWarehouseDemo } from "../src/mocks/data/warehouse-demo.ts";
import { createSalesDemo } from "../src/mocks/data/sales-demo.ts";
test("inline search resolves real entities and respects all five role boundaries", () => {
  const data = createSalesDemo(createWarehouseDemo());
  assert.equal(findSearchResults("owner", "   ", data).length, 0);
  assert.equal(
    findSearchResults("owner", "zr-2610-0011", data)[0].href,
    "/gudang/inventaris/ZR-2610-0011",
  );
  assert.equal(
    findSearchResults("packing", "ord-261121-001", data)[0].href,
    "/pengiriman/packing/ORD-261121-001",
  );
  assert.equal(
    findSearchResults("admin", "@rina.thrift", data)[0].href,
    "/penjualan/pelanggan/customer-rina",
  );
  assert.equal(findSearchResults("live-host", "ORD", data).length, 0);
  assert.equal(findSearchResults("packing", "ZR", data).length, 0);
  assert.equal(findSearchResults("penyortir", "@rina", data).length, 0);
  for (const role of roles)
    for (const query of ["ZR", "ORD", "@", "laporan", "lokasi", "beranda"]) {
      const results = findSearchResults(role, query, data);
      assert.ok(results.length <= 8);
      for (const result of results) {
        assert.ok(canAccessPath(role, result.href));
        assert.ok(!result.href.includes("["));
      }
    }
});
test("notifications are removed from navigation, search and role access", () => {
  assert.ok(
    !pages.some((page) => page.id === "S05" || page.module === "notifikasi"),
  );
  for (const role of roles) {
    assert.equal(canAccessPath(role, "/notifikasi"), false);
    assert.deepEqual(findSearchResults(role, "notifikasi"), []);
  }
});
