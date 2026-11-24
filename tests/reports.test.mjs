import assert from "node:assert/strict";
import test from "node:test";
import { createWarehouseDemo } from "../src/mocks/data/warehouse-demo.ts";
import { createSalesDemo } from "../src/mocks/data/sales-demo.ts";
import { createPaymentsDemo } from "../src/mocks/data/payments-demo.ts";
import {
  createReportsDemo,
  strategyRecipients,
} from "../src/mocks/data/reports-demo.ts";
import {
  reportData,
  soldRows,
  ageBuckets,
  monthOf,
} from "../src/features/laporan/selectors.ts";
import { applyReportsCommand as applyCommand } from "../src/features/laporan/operations.ts";
const applyReportsCommand = (...args) =>
  applyCommand(...args, strategyRecipients);
import { isReportsState } from "../src/features/laporan/persistence.ts";
import { csvText } from "../src/features/laporan/csv.ts";
const actor = {
  id: "user-owner",
  name: "Zahra",
  email: "zahra@zaraff.id",
  role: "owner",
};
const now = "2026-11-24T11:00:00+07:00";
const fresh = () => {
  const data = createSalesDemo(createWarehouseDemo());
  return createPaymentsDemo(data.sales, data.warehouse, true);
};
test("reports use WIB sale date, net saved prices and consistent category totals", () => {
  assert.equal(monthOf("2026-10-31T18:00:00Z"), "2026-11");
  const data = fresh();
  const original = structuredClone(data);
  const report = reportData(data.warehouse, data.sales, "2026-11");
  assert.equal(report.sold.length, 3);
  assert.equal(report.revenue, 280000);
  assert.equal(
    report.categories.reduce((sum, row) => sum + row.revenue, 0),
    report.revenue,
  );
  assert.equal(
    report.categories.reduce((sum, row) => sum + row.count, 0),
    report.sold.length,
  );
  assert.ok(!report.sold.some((row) => row.id === "ZR-2610-0017"));
  const fajar = data.warehouse.items.find((row) => row.id === "ZR-2610-0017");
  fajar.soldAt = now;
  fajar.status = "sold";
  data.sales.orders.find((row) => row.id === fajar.orderId).paymentStatus =
    "approved";
  assert.equal(
    soldRows(data.warehouse, data.sales, "2026-11").find(
      (row) => row.id === fajar.id,
    ).netPrice,
    63000,
  );
  assert.equal(reportData(data.warehouse, data.sales, "2026-10").revenue, 0);
  assert.deepEqual(original.sales.customers, data.sales.customers);
});
test("multi-line discount allocation keeps every rupiah and ignores current price edits", () => {
  const data = fresh();
  const order = data.sales.orders.find((row) => row.id === "ORD-261121-001");
  const other = data.warehouse.items.find((row) => row.id === "ZR-2610-0014");
  other.soldAt = now;
  other.status = "sold";
  order.lines = [
    { itemId: "ZR-2610-0011", category: "Kemeja", grade: "A", price: 1 },
    { itemId: other.id, category: "Kemeja", grade: "C", price: 2 },
  ];
  order.itemIds.push(other.id);
  order.subtotal = 3;
  order.total = 2;
  order.memberDiscount = 1;
  data.warehouse.items.find((row) => row.id === "ZR-2610-0011").price = 999999;
  const rows = soldRows(data.warehouse, data.sales, "2026-11").filter((row) =>
    order.itemIds.includes(row.id),
  );
  assert.equal(
    rows.reduce((sum, row) => sum + row.netPrice, 0),
    2,
  );
  assert.equal(rows.find((row) => row.id === other.id).netPrice, 2);
});
test("age buckets respect 30/60/90-day boundaries and exclude reserved stock", () => {
  const data = fresh();
  const base = data.warehouse.items[0];
  data.warehouse.items = [0, 30, 31, 60, 61, 90, 91].map((days, index) => ({
    ...base,
    id: `age-${index}`,
    status: "available",
    availableAt: new Date(Date.parse(now) - days * 86400000).toISOString(),
  }));
  data.warehouse.items.push({
    ...base,
    id: "reserved",
    status: "reserved",
    availableAt: "2026-01-01T00:00:00Z",
  });
  assert.deepEqual(
    ageBuckets(data.warehouse, now).map((row) => row.value),
    [2, 2, 2, 1],
  );
  const empty = { ...data.warehouse, items: [] };
  assert.deepEqual(
    ageBuckets(empty).map((row) => row.value),
    [0, 0, 0, 0],
  );
});
test("month-end stock includes later sales and excludes items not available yet", () => {
  const data = fresh();
  const row = data.warehouse.items[0];
  row.availableAt = "2026-10-31T23:30:00+07:00";
  const october = reportData(data.warehouse, data.sales, "2026-10");
  assert.ok(october.closing.some((item) => item.id === row.id));
  assert.ok(!october.closing.some((item) => item.id === "ZR-2610-0013"));
  assert.equal(
    october.grades.reduce((sum, row) => sum + row.count, 0),
    october.closing.length,
  );
  assert.ok(
    !reportData(data.warehouse, data.sales, "2026-11").closing.some(
      (item) => item.id === row.id,
    ),
  );
});
test("strategy drafts, recipients and one-time sending persist without mutating source", () => {
  const source = createReportsDemo();
  const original = structuredClone(source);
  const saved = applyReportsCommand(
    source,
    { type: "save-strategy", month: "2026-12", content: "  Promo stok lama  " },
    actor,
    now,
  );
  assert.deepEqual(source, original);
  const draft = saved.state.strategies.find((row) => row.id === saved.entityId);
  assert.equal(draft.content, "Promo stok lama");
  assert.equal(draft.sentAt, null);
  const sent = applyReportsCommand(
    saved.state,
    {
      type: "send-strategy",
      strategyId: draft.id,
      recipientIds: ["user-sorter", "user-packing"],
    },
    { ...actor, role: "admin" },
    now,
  );
  assert.equal(sent.state.strategies[0].sentAt, now);
  assert.equal(sent.state.strategies[0].recipientIds.length, 2);
  assert.ok(isReportsState(JSON.parse(JSON.stringify(sent.state))));
  assert.throws(
    () =>
      applyReportsCommand(
        sent.state,
        {
          type: "send-strategy",
          strategyId: draft.id,
          recipientIds: ["user-admin"],
        },
        actor,
        now,
      ),
    /sudah dikirim/,
  );
  assert.throws(
    () =>
      applyReportsCommand(
        saved.state,
        { type: "save-strategy", month: "2026-12", content: "Duplicate" },
        actor,
        now,
      ),
    /sudah tersedia/,
  );
  for (const recipients of [[], ["unknown"], ["user-admin", "user-admin"]])
    assert.throws(
      () =>
        applyReportsCommand(
          saved.state,
          {
            type: "send-strategy",
            strategyId: draft.id,
            recipientIds: recipients,
          },
          actor,
          now,
        ),
      /staf/,
    );
  for (const role of ["packing", "live-host", "penyortir"])
    assert.throws(
      () =>
        applyReportsCommand(
          source,
          { type: "save-strategy", month: "2026-12", content: "Invalid" },
          { ...actor, role },
          now,
        ),
      /Owner dan Admin/,
    );
  assert.throws(
    () =>
      applyReportsCommand(
        source,
        { type: "save-strategy", month: "2026-13", content: "Invalid" },
        actor,
        now,
      ),
    /Bulan/,
  );
  assert.throws(
    () =>
      applyReportsCommand(
        source,
        { type: "save-strategy", month: "2026-12", content: " " },
        actor,
        now,
      ),
    /wajib/,
  );
  assert.equal(isReportsState({ version: 1, strategies: [{}] }), false);
});
test("CSV preserves quotes, separators, multiline values and neutralizes formulas", () => {
  const csv = csvText([
    ["Kategori", "Pendapatan"],
    ["Kemeja, vintage", 85000],
    ["Baris\nbaru", 0],
    ['Kutip "dua"', 1],
    [" =SUM(A1:A2)", 3],
    ["@handle", 4],
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"Kemeja, vintage","85000"'));
  assert.ok(csv.includes('"Kutip ""dua""","1"'));
  assert.ok(csv.includes('"\' =SUM(A1:A2)","3"'));
  assert.ok(csv.includes('"\'@handle","4"'));
});
