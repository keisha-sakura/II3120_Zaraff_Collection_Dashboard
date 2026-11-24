import assert from "node:assert/strict";
import test from "node:test";
import { createWarehouseDemo } from "../src/mocks/data/warehouse-demo.ts";
import { createSalesDemo } from "../src/mocks/data/sales-demo.ts";
import { createSettingsDemo } from "../src/mocks/data/settings-demo.ts";
import { applySettingsCommand } from "../src/features/pengaturan/operations.ts";
import { isSettingsState } from "../src/features/pengaturan/persistence.ts";
import { applySalesCommand } from "../src/features/penjualan/operations.ts";
import { applyWarehouseCommand } from "../src/features/gudang/operations.ts";
const now = "2026-11-24T10:00:00+07:00";
const fresh = () => ({
  ...createSalesDemo(createWarehouseDemo()),
  settings: createSettingsDemo(),
});
const apply = (data, command, role = "owner") =>
  applySettingsCommand(data.settings, data.sales, data.warehouse, command, {
    role,
  });
test("price rules save all grades without repricing existing stock or orders", () => {
  const data = fresh();
  const before = structuredClone(data);
  const prices = structuredClone(data.settings.priceRules);
  prices.Kaos.A = 99000;
  prices.Kemeja.C = 47000;
  const result = apply(data, { type: "save-prices", priceRules: prices });
  assert.equal(result.settings.priceRules.Kaos.A, 99000);
  assert.equal(result.settings.priceRules.Kemeja.C, 47000);
  assert.deepEqual(result.sales, before.sales);
  assert.deepEqual(result.warehouse, before.warehouse);
  assert.deepEqual(data, before);
  for (const price of [0, -1, 1.5, NaN, Infinity, 1000000001]) {
    const invalid = structuredClone(prices);
    invalid.Kemeja.A = price;
    assert.throws(
      () => apply(data, { type: "save-prices", priceRules: invalid }),
      /rupiah bulat/,
    );
  }
  assert.ok(isSettingsState(JSON.parse(JSON.stringify(result.settings))));
  assert.equal(isSettingsState({ version: 1, priceRules: {} }), false);
});
test("discount changes only new member orders; nonmembers and historical amounts stay intact", () => {
  const data = fresh();
  const result = apply(data, { type: "save-discount", percent: 12.5 }, "admin");
  assert.deepEqual(result.sales.orders, data.sales.orders);
  assert.deepEqual(result.sales.deposits, data.sales.deposits);
  assert.deepEqual(result.warehouse, data.warehouse);
  const claims = applySalesCommand(
    result.sales,
    result.warehouse,
    {
      type: "process-claims",
      liveId: "live-261123",
      text: "@rina.thrift,ZR-2609-0008,19:24:00\n@dodi_ootd,ZR-2609-0009,19:25:00",
    },
    "Keisha",
    now,
  );
  const member = claims.sales.orders.find((order) =>
    order.itemIds.includes("ZR-2609-0008"),
  );
  const nonmember = claims.sales.orders.find((order) =>
    order.itemIds.includes("ZR-2609-0009"),
  );
  assert.equal(member.memberDiscount, 14375);
  assert.equal(member.total, 100625);
  assert.equal(nonmember.total, 115000);
  for (const percent of [0, 100])
    assert.equal(
      apply(data, { type: "save-discount", percent }).sales
        .memberDiscountPercent,
      percent,
    );
  for (const percent of [-1, 101, NaN, Infinity, 10.001])
    assert.throws(
      () => apply(data, { type: "save-discount", percent }),
      /Diskon/,
    );
});
test("locations normalize unique codes and feed correctly typed warehouse workflows", () => {
  const data = fresh();
  const rack = apply(data, {
    type: "add-location",
    code: " r03-s01 ",
    description: " Rak celana ",
  });
  assert.deepEqual(rack.warehouse.locations.at(-1), {
    id: "R03-S01",
    code: "R03-S01",
    description: "Rak celana",
    kind: "rack",
  });
  assert.deepEqual(rack.warehouse.items, data.warehouse.items);
  assert.throws(
    () =>
      apply(rack, {
        type: "add-location",
        code: "r03-s01",
        description: "Duplicate",
      }),
    /sudah digunakan/,
  );
  const graded = applyWarehouseCommand(
    rack.warehouse,
    {
      type: "grade",
      itemId: "ZR-2611-0020",
      grade: "A",
      price: 60000,
      locationId: "R03-S01",
      confirmedClean: true,
    },
    "Jojo",
    now,
  );
  assert.equal(
    graded.state.items.find((item) => item.id === "ZR-2611-0020").locationId,
    "R03-S01",
  );
  const bale = apply(rack, {
    type: "add-location",
    code: "BL-B01",
    description: "Area bale",
  });
  assert.equal(bale.warehouse.locations.at(-1).kind, "bale");
  assert.throws(
    () =>
      applyWarehouseCommand(
        bale.warehouse,
        {
          type: "grade",
          itemId: "ZR-2611-0020",
          grade: "A",
          price: 60000,
          locationId: "BL-B01",
          confirmedClean: true,
        },
        "Jojo",
        now,
      ),
    /lokasi rak/,
  );
  for (const [code, description] of [
    ["bad code", "Rak"],
    ["OTHER-01", "Rak"],
    ["R03-S01", " "],
    ["R03-S01", "x".repeat(161)],
  ])
    assert.throws(() =>
      apply(data, { type: "add-location", code, description }),
    );
});
test("all settings mutations reject sorter, host and packing roles without side effects", () => {
  const data = fresh();
  const before = structuredClone(data);
  for (const role of ["penyortir", "live-host", "packing"])
    for (const command of [
      { type: "save-prices", priceRules: data.settings.priceRules },
      { type: "save-discount", percent: 20 },
      { type: "add-location", code: "R03-S01", description: "Rak" },
    ])
      assert.throws(() => apply(data, command, role), /Owner dan Admin/);
  assert.deepEqual(data, before);
});
