import assert from "node:assert/strict";
import test from "node:test";
import { mockUsers } from "../src/mocks/data/users.ts";
import {
  mockBales,
  mockItems,
  mockLocations,
} from "../src/mocks/data/warehouse.ts";
import {
  mockCustomers,
  mockLiveSessions,
  mockOrders,
} from "../src/mocks/data/sales.ts";
import { mockPayments } from "../src/mocks/data/payments.ts";
import { mockStrategies } from "../src/mocks/data/reports.ts";
import { roles } from "../src/config/roles.ts";

test("mock relations, order totals, and lifecycle dates are coherent", () => {
  const has = (records, id) => records.some((record) => record.id === id);
  for (const records of [
    mockUsers,
    mockBales,
    mockItems,
    mockLocations,
    mockCustomers,
    mockOrders,
    mockPayments,
    mockLiveSessions,
    mockStrategies,
  ]) {
    assert.equal(
      new Set(records.map((record) => record.id)).size,
      records.length,
    );
  }
  assert.deepEqual(new Set(mockUsers.map((user) => user.role)), new Set(roles));
  for (const bale of mockBales)
    if (bale.locationId) assert.ok(has(mockLocations, bale.locationId));
  for (const item of mockItems) {
    assert.ok(has(mockBales, item.baleId));
    if (item.locationId) assert.ok(has(mockLocations, item.locationId));
    if (item.soldAt)
      assert.ok(
        item.availableAt && new Date(item.soldAt) >= new Date(item.availableAt),
      );
    if (item.outboundAt)
      assert.ok(
        item.soldAt && new Date(item.outboundAt) >= new Date(item.soldAt),
      );
  }
  for (const order of mockOrders) {
    assert.ok(has(mockCustomers, order.customerId));
    assert.equal(order.total, order.subtotal - order.memberDiscount);
    for (const id of order.itemIds) assert.ok(has(mockItems, id));
    assert.equal(
      order.subtotal,
      order.itemIds.reduce(
        (total, id) => total + mockItems.find((item) => item.id === id).price,
        0,
      ),
    );
  }
  for (const payment of mockPayments) {
    const order = mockOrders.find((order) => order.id === payment.orderId);
    assert.ok(order);
    if (payment.status === "approved")
      assert.equal(payment.amount, order.total);
  }
  for (const session of mockLiveSessions) {
    assert.ok(has(mockUsers, session.hostId));
    for (const id of session.itemIds) assert.ok(has(mockItems, id));
  }
  for (const strategy of mockStrategies) {
    assert.ok(has(mockUsers, strategy.authorId));
    for (const id of strategy.recipientIds) assert.ok(has(mockUsers, id));
  }
});
