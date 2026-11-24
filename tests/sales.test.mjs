import assert from "node:assert/strict";
import test from "node:test";
import { createWarehouseDemo } from "../src/mocks/data/warehouse-demo.ts";
import { createSalesDemo } from "../src/mocks/data/sales-demo.ts";
import { parseClaims } from "../src/features/penjualan/claims.ts";
import { applySalesCommand } from "../src/features/penjualan/operations.ts";
import { isSalesState } from "../src/features/penjualan/persistence.ts";
const now = "2026-11-24T10:00:00+07:00";
const fresh = () => createSalesDemo(createWarehouseDemo());
const apply = (data, command) =>
  applySalesCommand(data.sales, data.warehouse, command, "Keisha", now);
test("claim parsing retains millisecond precision, quoted CSV, headers and invalid rows", () => {
  const rows = parseClaims(
    '\uFEFFhandle,kode,waktu\r\n"@Rina.Thrift","zr-2609-0008","19:24:03,120"\r\n@dodi_ootd,ZR-2609-0008,19:24:03.01\n@bad,ZR-2609-0008,25:00:00\ninvalid',
  );
  assert.equal(rows.length, 4);
  assert.equal(rows[0].handle, "@rina.thrift");
  assert.equal(rows[0].time, "19:24:03.120");
  assert.equal(rows[0].milliseconds - rows[1].milliseconds, 110);
  assert.ok(rows[2].error);
  assert.ok(rows[3].error);
});
test("fastest claim wins, orders reserve warehouse stock, and duplicate processing is blocked", () => {
  const initial = fresh();
  const before = structuredClone(initial);
  const result = apply(initial, {
    type: "process-claims",
    liveId: "live-261123",
    text: "@dodi_ootd,ZR-2609-0008,19:24:03.480\n@rina.thrift,ZR-2609-0008,19:24:03.120\n@fajarkoleksi,ZR-2609-0009,19:25:10.002\n@rina.thrift,ZR-2609-0008,19:24:03.120\n@mega.preloved,ZR-9999-0001,19:26:00\n@sarivintage,ZR-2610-0013,19:27:00",
  });
  const live = result.sales.lives.find((live) => live.id === "live-261123");
  assert.equal(
    live.results.filter((claim) => claim.outcome === "won").length,
    2,
  );
  assert.equal(
    live.results.filter((claim) => claim.outcome === "rejected").length,
    2,
  );
  assert.equal(
    live.results.filter((claim) => claim.outcome === "invalid").length,
    2,
  );
  const item = result.warehouse.items.find(
    (item) => item.id === "ZR-2609-0008",
  );
  assert.equal(item.status, "reserved");
  const order = result.sales.orders.find((order) => order.id === item.orderId);
  assert.equal(order.customerId, "customer-rina");
  assert.equal(order.total, 103500);
  assert.equal(
    result.warehouse.movements.find(
      (entry) =>
        entry.entityId === item.id &&
        entry.action === "Reservasi dari klaim live",
    ).actor,
    "Keisha",
  );
  assert.equal(result.sales.orders.length, initial.sales.orders.length + 2);
  assert.deepEqual(initial, before);
  assert.throws(
    () =>
      apply(result, {
        type: "process-claims",
        liveId: "live-261123",
        text: "@rina.thrift,ZR-2609-0008,19:24:00",
      }),
    /sudah diproses/,
  );
  assert.ok(isSalesState(JSON.parse(JSON.stringify(result.sales))));
});
test("same buyer groups multiple winning items and an unknown handle creates one customer", () => {
  const data = fresh();
  const result = apply(data, {
    type: "process-claims",
    liveId: "live-261123",
    text: "@new_buyer,ZR-2609-0008,19:24:00\n@new_buyer,ZR-2609-0009,19:25:00",
  });
  assert.equal(result.sales.orders.length, data.sales.orders.length + 1);
  const order = result.sales.orders[0];
  assert.equal(order.lines.length, 2);
  assert.equal(order.total, 230000);
  assert.equal(
    result.sales.customers.find((customer) => customer.id === order.customerId)
      .handle,
    "@new_buyer",
  );
  assert.equal(
    new Set(
      result.sales.lives
        .find((live) => live.id === "live-261123")
        .results.map((claim) => claim.orderId),
    ).size,
    1,
  );
});
test("wizard checks content, available selection and stale stock before save", () => {
  let data = fresh();
  data = apply(data, { type: "start-draft" });
  assert.throws(
    () =>
      apply(data, {
        type: "save-content",
        input: {
          title: "AB",
          content: "test",
          scheduledAt: "2026-11-28T19:00:00+07:00",
          hostId: "user-host",
          promotionChannels: ["TikTok"],
        },
      }),
    /Judul/,
  );
  data = apply(data, {
    type: "save-content",
    input: {
      title: "Live QA",
      content: "Koleksi pilihan Zaraff",
      scheduledAt: "2026-11-28T19:00:00+07:00",
      hostId: "user-host",
      promotionChannels: ["TikTok", "TikTok"],
    },
  });
  assert.throws(
    () => apply(data, { type: "select-items", itemIds: ["ZR-2610-0013"] }),
    /tidak tersedia/,
  );
  data = apply(data, { type: "select-items", itemIds: ["ZR-2609-0008"] });
  const stale = structuredClone(data);
  stale.warehouse.items.find((item) => item.id === "ZR-2609-0008").status =
    "reserved";
  assert.throws(
    () => apply(stale, { type: "save-live", publish: true }),
    /tidak tersedia/,
  );
  const result = apply(data, { type: "save-live", publish: true });
  assert.equal(result.sales.lives[0].status, "published");
  assert.deepEqual(result.sales.lives[0].promotionChannels, ["TikTok"]);
  assert.equal(result.sales.draft, null);
  assert.equal(
    result.warehouse.items.find((item) => item.id === "ZR-2609-0008").status,
    "available",
  );
  assert.throws(
    () => apply(data, { type: "start-draft", liveId: "live-261123" }),
    /sudah selesai/,
  );
});
test("customer edits enforce unique handles and preserve deposit and historical order totals", () => {
  const data = fresh();
  const input = {
    name: "Fajar Baru",
    handle: "@FAJARKOLEKSI",
    phone: "081190904545",
    isMember: false,
  };
  const result = apply(data, {
    type: "update-customer",
    customerId: "customer-fajar",
    input,
  });
  assert.equal(
    result.sales.customers.find((customer) => customer.id === "customer-fajar")
      .depositBalance,
    315500,
  );
  assert.deepEqual(result.sales.orders, data.sales.orders);
  assert.deepEqual(result.sales.deposits, data.sales.deposits);
  assert.throws(
    () =>
      apply(data, {
        type: "add-customer",
        input: { ...input, handle: "@rina.thrift" },
      }),
    /sudah digunakan/,
  );
  assert.throws(
    () =>
      apply(data, { type: "add-customer", input: { ...input, phone: "123" } }),
    /WhatsApp/,
  );
  const invalid = structuredClone(data.sales);
  invalid.orders[0].status = "unknown";
  assert.equal(isSalesState(invalid), false);
});
test("sales fixture expands missing stock without overwriting warehouse edits", () => {
  const warehouse = createWarehouseDemo();
  warehouse.items.find((item) => item.id === "ZR-2610-0013").locationId =
    "R02-S03";
  const data = createSalesDemo(warehouse);
  assert.equal(
    data.warehouse.items.find((item) => item.id === "ZR-2610-0013").locationId,
    "R02-S03",
  );
  for (const order of data.sales.orders) {
    assert.ok(
      data.sales.customers.some((customer) => customer.id === order.customerId),
    );
    assert.equal(order.total, order.subtotal - order.memberDiscount);
    for (const id of order.itemIds)
      assert.ok(data.warehouse.items.some((item) => item.id === id));
  }
});

test("equal claim timestamps use original source line and explain both decisions", () => {
  const data = fresh();
  const result = apply(data, {
    type: "process-claims",
    liveId: "live-261123",
    text: "@dodi_ootd,ZR-2609-0008,19:24:03.120\n@rina.thrift,ZR-2609-0008,19:24:03.120",
  });
  const claims = result.sales.lives.find(
    (row) => row.id === "live-261123",
  ).results;
  assert.equal(
    claims.find((row) => row.outcome === "won").handle,
    "@dodi_ootd",
  );
  assert.match(claims.find((row) => row.outcome === "won").reason, /baris 1/);
  assert.match(
    claims.find((row) => row.outcome === "rejected").reason,
    /Waktu sama.*baris 1/,
  );
});
