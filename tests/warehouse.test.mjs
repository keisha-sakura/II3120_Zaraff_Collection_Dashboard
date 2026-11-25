import assert from "node:assert/strict";
import test from "node:test";
import { createWarehouseDemo } from "../src/mocks/data/warehouse-demo.ts";
import {
  applyWarehouseCommand,
  nextWarehouseCode,
} from "../src/features/gudang/operations.ts";
import { isWarehouseState } from "../src/features/gudang/persistence.ts";
import { daysSince } from "../src/features/gudang/model.ts";

const now = "2026-11-24T10:00:00+07:00";
const apply = (state, command) =>
  applyWarehouseCommand(state, command, "Jojo", now);
test("receive, start sorting, save stock/return, finish, grade and relocate", () => {
  const original = createWarehouseDemo();
  const before = structuredClone(original);
  const received = apply(original, {
    type: "receive",
    input: {
      supplier: "CV Bale Jaya",
      category: "Kaos Campur",
      weightKg: 25,
      estimatedItems: 2,
      receivedAt: "2026-11-24T09:00:00+07:00",
      locationId: "BL-A02",
    },
  });
  const baleId = received.entityId;
  let state = apply(received.state, { type: "start-sort", baleId }).state;
  const stock = apply(state, {
    type: "record-item",
    input: {
      baleId,
      category: "Kaos",
      condition: "Baik (cacat minor)",
      outcome: "laundry",
      reason: "",
    },
  });
  const itemId = stock.entityId;
  const returned = apply(stock.state, {
    type: "record-item",
    input: {
      baleId,
      category: "Kaos",
      condition: "Tidak Layak (cacat terlihat)",
      outcome: "return",
      reason: "Bolong",
    },
  });
  state = apply(returned.state, { type: "finish-sort", baleId }).state;
  assert.equal(state.bales.find((bale) => bale.id === baleId).locationId, null);
  assert.equal(state.bales.find((bale) => bale.id === baleId).status, "sorted");
  assert.ok(state.returns.some((item) => item.id === returned.entityId));
  state = apply(state, {
    type: "grade",
    itemId,
    grade: "B",
    price: 45000,
    locationId: "R01-S02",
    confirmedClean: true,
  }).state;
  assert.equal(
    state.items.find((item) => item.id === itemId).status,
    "available",
  );
  state = apply(state, { type: "move", itemId, locationId: "R02-S03" }).state;
  assert.equal(
    state.items.find((item) => item.id === itemId).locationId,
    "R02-S03",
  );
  assert.equal(state.movements[0].from, "R01-S02");
  assert.equal(state.movements[0].to, "R02-S03");
  assert.equal(state.movements[0].actor, "Jojo");
  assert.deepEqual(
    original,
    before,
    "Commands must not mutate existing snapshots",
  );
  assert.ok(isWarehouseState(JSON.parse(JSON.stringify(state))));
});
test("invalid transitions and wrong location types cannot change warehouse data", () => {
  const state = createWarehouseDemo();
  assert.throws(
    () => apply(state, { type: "finish-sort", baleId: "BL-261121-001" }),
    /sedang disortir/,
  );
  assert.throws(
    () => apply(state, { type: "start-sort", baleId: "BL-261030-001" }),
    /selesai disortir/,
  );
  assert.throws(
    () =>
      apply(state, {
        type: "record-item",
        input: {
          baleId: "BL-261119-001",
          category: "Kaos",
          condition: "Tidak Layak (cacat terlihat)",
          outcome: "laundry",
          reason: "",
        },
      }),
    /harus dicatat sebagai retur/,
  );
  assert.throws(
    () =>
      apply(state, {
        type: "record-item",
        input: {
          baleId: "BL-261119-001",
          category: "Kaos",
          condition: "Tidak Layak (cacat terlihat)",
          outcome: "return",
          reason: " ",
        },
      }),
    /Alasan retur/,
  );
  assert.throws(
    () =>
      apply(state, {
        type: "grade",
        itemId: "ZR-2611-0020",
        grade: "A",
        price: 60000,
        locationId: "R01-S02",
        confirmedClean: false,
      }),
    /Konfirmasi/,
  );
  assert.throws(
    () =>
      apply(state, {
        type: "grade",
        itemId: "ZR-2611-0020",
        grade: "A",
        price: 0,
        locationId: "R01-S02",
        confirmedClean: true,
      }),
    /harga/,
  );
  assert.throws(
    () =>
      apply(state, {
        type: "grade",
        itemId: "ZR-2610-0013",
        grade: "A",
        price: 60000,
        locationId: "R01-S02",
        confirmedClean: true,
      }),
    /hanya tersedia/,
  );
  assert.throws(
    () =>
      apply(state, {
        type: "move",
        itemId: "ZR-2610-0013",
        locationId: "BL-A01",
      }),
    /lokasi rak/,
  );
  assert.throws(
    () =>
      apply(state, {
        type: "move",
        itemId: "ZR-2610-0013",
        locationId: "R01-S01",
      }),
    /berbeda/,
  );
  const moved = apply(state, {
    type: "move",
    itemId: "ZR-2610-0013",
    locationId: "R02-S03",
  }).state.items.find((item) => item.id === "ZR-2610-0013");
  assert.equal(moved.status, "reserved");
  assert.equal(moved.price, 65000);
});
test("codes avoid duplicates and use Jakarta dates; persistence rejects malformed snapshots", () => {
  assert.equal(daysSince("2026-11-03T14:08:00+07:00", now), 21);
  assert.equal(daysSince("2026-11-23T18:00:00Z", now), 0);
  assert.equal(
    nextWarehouseCode("ZR", ["ZR-2611-0024", "ZR-2610-9999"], now),
    "ZR-2611-0025",
  );
  assert.equal(
    nextWarehouseCode("BL", [], "2026-11-23T18:00:00Z"),
    "BL-261124-001",
  );
  assert.equal(isWarehouseState({ version: 1, items: [] }), false);
  const invalid = createWarehouseDemo();
  invalid.items[0].status = "unexpected";
  assert.equal(isWarehouseState(invalid), false);
  const state = createWarehouseDemo();
  assert.ok(isWarehouseState(state));
  for (const item of state.items) {
    const bale = state.bales.find((bale) => bale.id === item.baleId);
    assert.ok(bale, item.baleId);
    assert.ok(
      Date.parse(item.sortedAt) >= Date.parse(bale.receivedAt),
      item.id,
    );
    if (item.availableAt)
      assert.ok(
        Date.parse(item.availableAt) >= Date.parse(item.sortedAt),
        item.id,
      );
    if (item.locationId)
      assert.ok(
        state.locations.some(
          (location) =>
            location.id === item.locationId && location.kind === "rack",
        ),
      );
  }
});
