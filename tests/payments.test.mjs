import assert from "node:assert/strict";
import test from "node:test";
import { createWarehouseDemo } from "../src/mocks/data/warehouse-demo.ts";
import { createSalesDemo } from "../src/mocks/data/sales-demo.ts";
import {
  createPaymentsDemo,
  ensureInvoices,
} from "../src/mocks/data/payments-demo.ts";
import {
  applyPaymentCommand,
  approvalIssue,
} from "../src/features/pembayaran/operations.ts";
import { isPaymentsState } from "../src/features/pembayaran/persistence.ts";
const now = "2026-11-24T10:00:00+07:00";
function fresh() {
  const data = createSalesDemo(createWarehouseDemo());
  return createPaymentsDemo(data.sales, data.warehouse, true);
}
const apply = (data, command) =>
  applyPaymentCommand(
    data.payments,
    data.sales,
    data.warehouse,
    command,
    "Keisha",
    now,
  );
test("fresh payment demo provides pending deposit; migration preserves existing paid balances", () => {
  const seed = createSalesDemo(createWarehouseDemo());
  const copy = structuredClone(seed);
  const prepared = createPaymentsDemo(seed.sales, seed.warehouse, true);
  assert.equal(
    prepared.sales.customers.find(
      (customer) => customer.id === "customer-fajar",
    ).depositBalance,
    378500,
  );
  assert.equal(
    prepared.payments.attempts.find((attempt) => attempt.id === "payment-fajar")
      .status,
    "pending",
  );
  assert.equal(
    prepared.warehouse.items.find((item) => item.id === "ZR-2610-0017").status,
    "reserved",
  );
  const migrated = createPaymentsDemo(seed.sales, seed.warehouse);
  assert.deepEqual(migrated.sales, seed.sales);
  assert.deepEqual(migrated.warehouse, seed.warehouse);
  assert.equal(
    migrated.sales.customers.find(
      (customer) => customer.id === "customer-fajar",
    ).depositBalance,
    315500,
  );
  assert.equal(
    migrated.payments.attempts.find((attempt) => attempt.id === "payment-fajar")
      .status,
    "approved",
  );
  assert.deepEqual(seed, copy);
});
test("deposit approval updates balance, ledger, order and stock once, keeping shelf location", () => {
  const initial = fresh();
  const copy = structuredClone(initial);
  const result = apply(initial, {
    type: "approve",
    paymentId: "payment-fajar",
  });
  const customer = result.sales.customers.find(
    (customer) => customer.id === "customer-fajar",
  );
  assert.equal(customer.depositBalance, 315500);
  assert.equal(
    result.sales.deposits.filter(
      (entry) => entry.id === "payment-debit-payment-fajar",
    ).length,
    1,
  );
  assert.equal(
    result.sales.orders.find((order) => order.id === "ORD-261121-002").status,
    "paid",
  );
  const item = result.warehouse.items.find(
    (item) => item.id === "ZR-2610-0017",
  );
  assert.equal(item.status, "sold");
  assert.equal(item.locationId, "R02-S02");
  assert.equal(item.outboundAt, null);
  assert.equal(item.soldAt, now);
  const payment = result.payments.attempts.find(
    (attempt) => attempt.id === "payment-fajar",
  );
  assert.equal(payment.balanceBefore, 378500);
  assert.equal(payment.balanceAfter, 315500);
  assert.equal(payment.reviewedBy, "Keisha");
  assert.throws(
    () => apply(result, { type: "approve", paymentId: "payment-fajar" }),
    /sudah ditinjau/,
  );
  assert.throws(
    () =>
      apply(result, {
        type: "reject",
        paymentId: "payment-fajar",
        reason: "Ulang",
      }),
    /sudah ditinjau/,
  );
  assert.deepEqual(initial, copy);
  assert.ok(isPaymentsState(JSON.parse(JSON.stringify(result.payments))));
});
test("insufficient balance and changed reservations block approval without side effects", () => {
  const low = fresh();
  low.sales.customers.find(
    (customer) => customer.id === "customer-fajar",
  ).depositBalance = 100;
  const copy = structuredClone(low);
  assert.throws(
    () => apply(low, { type: "approve", paymentId: "payment-fajar" }),
    /tidak mencukupi/,
  );
  assert.deepEqual(low, copy);
  const stale = fresh();
  stale.warehouse.items.find((item) => item.id === "ZR-2610-0017").orderId =
    "another-order";
  assert.throws(
    () => apply(stale, { type: "approve", paymentId: "payment-fajar" }),
    /Reservasi barang/,
  );
});
test("underpaid transfer requires rejection reason and returns invoice to unpaid without releasing stock", () => {
  const data = fresh();
  const attempt = data.payments.attempts.find(
    (attempt) => attempt.id === "payment-sari",
  );
  assert.match(approvalIssue(attempt, data.sales, data.warehouse), /Nominal/);
  assert.throws(
    () => apply(data, { type: "approve", paymentId: "payment-sari" }),
    /Nominal/,
  );
  assert.throws(
    () =>
      apply(data, { type: "reject", paymentId: "payment-sari", reason: "   " }),
    /Alasan/,
  );
  const result = apply(data, {
    type: "reject",
    paymentId: "payment-sari",
    reason: "Nominal kurang Rp 10.000",
  });
  assert.equal(
    result.sales.orders.find((order) => order.id === "ORD-261121-003")
      .paymentStatus,
    "unpaid",
  );
  assert.equal(
    result.warehouse.items.find((item) => item.id === "ZR-2610-0013").status,
    "reserved",
  );
  assert.deepEqual(result.sales.deposits, data.sales.deposits);
  assert.equal(
    result.payments.attempts.find((attempt) => attempt.id === "payment-sari")
      .rejectionReason,
    "Nominal kurang Rp 10.000",
  );
});
test("matching transfer approval never debits a customer deposit", () => {
  const data = fresh();
  const attempt = data.payments.attempts.find(
    (attempt) => attempt.id === "payment-sari",
  );
  attempt.amount = 58500;
  attempt.proof.amount = 58500;
  const result = apply(data, { type: "approve", paymentId: "payment-sari" });
  assert.equal(
    result.warehouse.items.find((item) => item.id === "ZR-2610-0013").status,
    "sold",
  );
  assert.equal(
    result.sales.orders.find((order) => order.id === "ORD-261121-003")
      .paymentStatus,
    "approved",
  );
  assert.deepEqual(result.sales.customers, data.sales.customers);
  assert.deepEqual(result.sales.deposits, data.sales.deposits);
});
test("reminders are idempotent per request and unavailable for paid or pending invoices", () => {
  const data = fresh();
  const invoiceId = "INV-261121-004";
  const first = apply(data, {
    type: "remind",
    invoiceId,
    requestId: "qa-reminder-unique",
  });
  const second = apply(first, {
    type: "remind",
    invoiceId,
    requestId: "qa-reminder-unique",
  });
  assert.deepEqual(first.payments.invoices, second.payments.invoices);
  assert.deepEqual(first.sales, data.sales);
  assert.deepEqual(first.warehouse, data.warehouse);
  assert.throws(
    () =>
      apply(data, {
        type: "remind",
        invoiceId: "INV-261121-001",
        requestId: "qa-invalid-paid",
      }),
    /hanya tersedia/,
  );
  assert.throws(
    () =>
      apply(data, {
        type: "remind",
        invoiceId: "INV-261121-003",
        requestId: "qa-invalid-pending",
      }),
    /hanya tersedia/,
  );
});
test("new sales orders gain invoices without replacing existing history", () => {
  const data = fresh();
  const original = structuredClone(data.payments);
  data.sales.orders.push({
    ...data.sales.orders[0],
    id: "ORD-261124-900",
    paymentStatus: "unpaid",
  });
  const result = ensureInvoices(data.payments, data.sales);
  assert.ok(result.invoices.some((invoice) => invoice.id === "INV-261124-900"));
  assert.deepEqual(data.payments, original);
  assert.deepEqual(
    result.invoices.find((invoice) => invoice.id === "INV-261121-004"),
    original.invoices.find((invoice) => invoice.id === "INV-261121-004"),
  );
  assert.equal(
    isPaymentsState({ version: 1, attempts: [{}], invoices: [] }),
    false,
  );
});
