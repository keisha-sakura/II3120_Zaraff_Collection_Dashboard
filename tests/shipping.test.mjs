import assert from "node:assert/strict";
import test from "node:test";
import { createWarehouseDemo } from "../src/mocks/data/warehouse-demo.ts";
import { createSalesDemo } from "../src/mocks/data/sales-demo.ts";
import { createPaymentsDemo } from "../src/mocks/data/payments-demo.ts";
import { createShippingDemo } from "../src/mocks/data/shipping-demo.ts";
import { applyShippingCommand } from "../src/features/pengiriman/operations.ts";
import { isShippingState } from "../src/features/pengiriman/persistence.ts";
import { emptyChecklist } from "../src/features/pengiriman/model.ts";
const now = "2026-11-24T11:00:00+07:00";
const packing = { name: "Rizky", role: "packing" };
const admin = { name: "Keisha", role: "admin" };
function fresh() {
  const data = createSalesDemo(createWarehouseDemo());
  const prepared = createPaymentsDemo(data.sales, data.warehouse, true);
  return { ...prepared, shipping: createShippingDemo(prepared.sales) };
}
const apply = (data, command, actor = packing) =>
  applyShippingCommand(
    data.shipping,
    data.sales,
    data.warehouse,
    command,
    actor,
    now,
  );
function complete(data, orderId = "ORD-261121-001") {
  const order = data.sales.orders.find((order) => order.id === orderId);
  const draft = apply(data, {
    type: "save-checklist",
    orderId,
    checklist: {
      pickedItemIds: [...order.itemIds],
      codeMatches: true,
      conditionMatches: true,
      packed: true,
    },
  });
  return apply(draft, { type: "mark-packed", orderId });
}
test("packing requires all confirmations and keeps stock sold on its shelf", () => {
  const data = fresh();
  const original = structuredClone(data);
  assert.throws(
    () => apply(data, { type: "mark-packed", orderId: "ORD-261121-001" }),
    /Lengkapi/,
  );
  const partial = apply(data, {
    type: "save-checklist",
    orderId: "ORD-261121-001",
    checklist: { ...emptyChecklist(), pickedItemIds: ["ZR-2610-0011"] },
  });
  assert.throws(
    () => apply(partial, { type: "mark-packed", orderId: "ORD-261121-001" }),
    /Lengkapi/,
  );
  const result = complete(data);
  assert.equal(
    result.sales.orders.find((order) => order.id === "ORD-261121-001").status,
    "packed",
  );
  assert.equal(
    result.shipping.packing.find(
      (record) => record.orderId === "ORD-261121-001",
    ).packedBy,
    "Rizky",
  );
  const item = result.warehouse.items.find(
    (item) => item.id === "ZR-2610-0011",
  );
  assert.equal(item.status, "sold");
  assert.equal(item.locationId, "R01-S01");
  assert.equal(item.outboundAt, null);
  assert.throws(
    () => apply(result, { type: "mark-packed", orderId: "ORD-261121-001" }),
    /belum dikemas/,
  );
  assert.deepEqual(data, original);
  assert.ok(isShippingState(JSON.parse(JSON.stringify(result.shipping))));
});
test("dispatch requires handover and changes order, stock and history together", () => {
  const data = complete(fresh());
  const command = {
    type: "dispatch",
    orderId: "ORD-261121-001",
    courier: "JNE",
    trackingNumber: " jp7714102238 ",
    handedOver: false,
  };
  assert.throws(() => apply(data, command, admin), /sudah diserahkan/);
  const result = apply(data, { ...command, handedOver: true }, admin);
  const order = result.sales.orders.find(
    (order) => order.id === command.orderId,
  );
  assert.equal(order.status, "shipped");
  assert.equal(order.shipment.trackingNumber, "JP7714102238");
  assert.equal(order.shipment.events[0].dateTime, now);
  const item = result.warehouse.items.find(
    (item) => item.id === "ZR-2610-0011",
  );
  assert.equal(item.status, "outbound");
  assert.equal(item.locationId, null);
  assert.equal(item.outboundAt, now);
  assert.equal(
    item.soldAt,
    data.warehouse.items.find((candidate) => candidate.id === item.id).soldAt,
  );
  assert.ok(
    result.warehouse.movements.some(
      (event) =>
        event.entityId === item.id && event.action === "Lokasi rak dilepas",
    ),
  );
  assert.throws(
    () => apply(result, { ...command, handedOver: true }, admin),
    /Hanya pesanan Dikemas/,
  );
});
test("packing cannot dispatch, and unrelated roles cannot mutate packing", () => {
  const data = complete(fresh());
  assert.throws(
    () =>
      apply(data, {
        type: "dispatch",
        orderId: "ORD-261121-001",
        courier: "JNE",
        trackingNumber: "JP7714102238",
        handedOver: true,
      }),
    /Owner dan Admin/,
  );
  for (const role of ["live-host", "penyortir"])
    assert.throws(
      () =>
        apply(
          fresh(),
          {
            type: "save-checklist",
            orderId: "ORD-261121-001",
            checklist: emptyChecklist(),
          },
          { name: "Other", role },
        ),
      /akses packing/,
    );
});
test("unpaid, stale or wrong-item orders cannot be packed or dispatched", () => {
  const data = fresh();
  assert.throws(
    () =>
      apply(data, {
        type: "save-checklist",
        orderId: "ORD-261121-003",
        checklist: emptyChecklist(),
      }),
    /harus Lunas/,
  );
  assert.throws(
    () =>
      apply(data, {
        type: "save-checklist",
        orderId: "ORD-261121-001",
        checklist: { ...emptyChecklist(), pickedItemIds: ["ZR-2610-0013"] },
      }),
    /tidak sesuai/,
  );
  const stale = fresh();
  stale.warehouse.items.find((item) => item.id === "ZR-2610-0011").status =
    "outbound";
  assert.throws(() => complete(stale), /sudah berubah/);
});
test("tracking validation and duplicate courier/tracking protection", () => {
  const data = complete(fresh());
  const command = {
    type: "dispatch",
    orderId: "ORD-261121-001",
    courier: "JNE",
    trackingNumber: "JP7714102238",
    handedOver: true,
  };
  assert.throws(
    () => apply(data, { ...command, trackingNumber: "bad value!" }, admin),
    /Nomor resi/,
  );
  assert.throws(
    () => apply(data, { ...command, courier: "Unknown" }, admin),
    /kurir/,
  );
  assert.throws(
    () =>
      apply(
        data,
        { ...command, courier: "J&T Express", trackingNumber: "jx2299877120" },
        admin,
      ),
    /sudah digunakan/,
  );
});
test("shipping migration preserves data and reconstructs existing packed records", () => {
  const data = fresh();
  const original = structuredClone(data.sales);
  const shipping = createShippingDemo(data.sales);
  const lala = shipping.packing.find(
    (record) => record.orderId === "ORD-261115-003",
  );
  assert.equal(lala.packedBy, "Rizky");
  assert.equal(lala.packedAt, "2026-11-22T10:00:00+07:00");
  assert.deepEqual(data.sales, original);
  assert.equal(
    isShippingState({
      version: 1,
      packing: [{ orderId: "bad", checklist: {} }],
    }),
    false,
  );
});
