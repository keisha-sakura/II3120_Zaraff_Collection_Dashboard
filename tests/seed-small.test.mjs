import assert from "node:assert/strict";
import test from "node:test";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { openDatabase } from "../src/server/db.ts";
import { seedDatabase, demoAccounts } from "../src/server/seed.ts";
import { login } from "../src/server/auth-core.ts";
import { loadWorkspace } from "../src/server/workspace.ts";
import { reportData } from "../src/features/laporan/selectors.ts";

test("small seed has five working roles and consistent inventory, payments and reports", () => {
  const ctx = openDatabase(":memory:");
  try {
    migrate(ctx.orm, { migrationsFolder: "drizzle" });
    assert.equal(seedDatabase(ctx, "small"), true);
    assert.equal(seedDatabase(ctx, "small"), false);
    assert.deepEqual(ctx.sqlite.pragma("foreign_key_check"), []);
    assert.equal(
      ctx.sqlite.prepare("SELECT count(*) AS count FROM users").get().count,
      5,
    );
    for (const account of demoAccounts) {
      const result = login(
        account.username,
        account.password,
        "127.0.0.1",
        ctx,
      );
      assert.equal(result.user.role, account.role);
    }
    const state = loadWorkspace(ctx, "user-owner");
    assert.equal(state.warehouse.items.length, 8);
    assert.equal(state.warehouse.bales.length, 2);
    assert.equal(state.sales.customers.length, 3);
    assert.equal(state.sales.lives.length, 2);
    assert.equal(state.sales.orders.length, 3);
    for (const customer of state.sales.customers) {
      assert.equal(
        state.sales.deposits
          .filter((entry) => entry.customerId === customer.id)
          .reduce((sum, entry) => sum + entry.amount, 0),
        customer.depositBalance,
      );
    }
    for (const order of state.sales.orders) {
      assert.equal(
        order.lines.reduce((sum, line) => sum + line.price, 0),
        order.subtotal,
      );
      assert.equal(order.subtotal - order.memberDiscount, order.total);
      const item = state.warehouse.items.find(
        (item) => item.id === order.itemIds[0],
      );
      assert.equal(item.orderId, order.id);
      assert.ok(
        state.sales.lives
          .find((live) => live.id === order.liveId)
          .itemIds.includes(item.id),
      );
      if (order.paymentStatus === "unpaid") {
        assert.equal(item.status, "reserved");
        assert.equal(order.shipment, null);
      } else {
        const payment = state.payments.attempts.find(
          (attempt) => attempt.orderId === order.id,
        );
        assert.equal(payment.status, "approved");
        assert.equal(payment.method, "deposit");
        assert.equal(
          payment.balanceBefore - payment.amount,
          payment.balanceAfter,
        );
        assert.ok(item.soldAt >= order.createdAt);
      }
      if (order.shipment) {
        assert.equal(item.status, "outbound");
        const packing = state.shipping.packing.find(
          (row) => row.orderId === order.id,
        );
        assert.ok(packing.packedAt < order.shipment.handedOverAt);
      }
    }
    assert.equal(
      reportData(state.warehouse, state.sales, "2026-11").revenue,
      215000,
    );
  } finally {
    ctx.sqlite.close();
  }
});
