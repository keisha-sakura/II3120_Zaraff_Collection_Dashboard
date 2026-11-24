import assert from "node:assert/strict";
import test from "node:test";
import { mockUsers } from "../src/mocks/data/users.ts";
import { mockLiveSessions } from "../src/mocks/data/sales.ts";
import { createWarehouseDemo } from "../src/mocks/data/warehouse-demo.ts";
import { createSalesDemo } from "../src/mocks/data/sales-demo.ts";
import { createPaymentsDemo } from "../src/mocks/data/payments-demo.ts";
import { createReportsDemo } from "../src/mocks/data/reports-demo.ts";
import { liveHosts } from "../src/features/penjualan/model.ts";
import { roles } from "../src/config/roles.ts";

test("operational demo relations, order totals, and lifecycle dates are coherent", () => {
  const seed = createSalesDemo(createWarehouseDemo());
  const { warehouse, sales, payments } = createPaymentsDemo(
    seed.sales,
    seed.warehouse,
    true,
  );
  const { strategies } = createReportsDemo();
  const has = (records, id) => records.some((record) => record.id === id);
  for (const records of [
    mockUsers,
    warehouse.bales,
    warehouse.items,
    warehouse.locations,
    sales.customers,
    sales.orders,
    payments.attempts,
    payments.invoices,
    sales.lives,
    strategies,
  ]) {
    assert.equal(
      new Set(records.map((record) => record.id)).size,
      records.length,
    );
  }
  assert.deepEqual(new Set(mockUsers.map((user) => user.role)), new Set(roles));
  for (const bale of warehouse.bales)
    if (bale.locationId) assert.ok(has(warehouse.locations, bale.locationId));
  for (const item of warehouse.items) {
    assert.ok(has(warehouse.bales, item.baleId), item.id);
    if (item.locationId) assert.ok(has(warehouse.locations, item.locationId));
    if (item.soldAt)
      assert.ok(
        item.availableAt && new Date(item.soldAt) >= new Date(item.availableAt),
      );
    if (item.outboundAt)
      assert.ok(
        item.soldAt && new Date(item.outboundAt) >= new Date(item.soldAt),
      );
  }
  for (const order of sales.orders) {
    assert.ok(has(sales.customers, order.customerId));
    assert.equal(order.total, order.subtotal - order.memberDiscount);
    for (const id of order.itemIds) assert.ok(has(warehouse.items, id));
    assert.equal(
      order.subtotal,
      order.lines.reduce((sum, line) => sum + line.price, 0),
    );
  }
  for (const payment of payments.attempts) {
    const order = sales.orders.find((order) => order.id === payment.orderId);
    assert.ok(order);
    if (payment.status === "approved")
      assert.equal(payment.amount, order.total);
  }
  for (const invoice of payments.invoices)
    assert.ok(has(sales.orders, invoice.orderId));
  for (const session of [...sales.lives, ...mockLiveSessions]) {
    assert.ok(has(liveHosts, session.hostId));
    for (const id of session.itemIds) assert.ok(has(warehouse.items, id));
  }
  for (const strategy of strategies) {
    assert.ok(has(mockUsers, strategy.authorId));
    for (const id of strategy.recipientIds) assert.ok(has(mockUsers, id));
  }
});
