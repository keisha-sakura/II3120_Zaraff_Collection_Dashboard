import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { Worker } from "node:worker_threads";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { openDatabase } from "../src/server/db.ts";
import { seedDatabase, demoAccounts } from "../src/server/seed.ts";
import {
  login,
  logout,
  sessionUser,
  checkPassword,
} from "../src/server/auth-core.ts";
import { loadWorkspace, visibleWorkspace } from "../src/server/workspace.ts";
import { executeOperation } from "../src/server/operations.ts";
import { extractionCsv } from "../src/server/gemini.ts";
import { parseClaims } from "../src/features/penjualan/claims.ts";
import { reportData } from "../src/features/laporan/selectors.ts";
import { homeDashboard } from "../src/server/home.ts";
const now = "2026-11-24T11:00:00.000Z";
const owner = {
  id: "user-owner",
  name: "Zahra",
  email: "zahra@zaraff.id",
  role: "owner",
};
function setup(t, file = false) {
  const directory = file
    ? mkdtempSync(join(tmpdir(), "zaraff-backend-test-"))
    : null;
  const filename = directory ? join(directory, "test.sqlite") : ":memory:";
  const ctx = openDatabase(filename);
  migrate(ctx.orm, { migrationsFolder: "drizzle" });
  seedDatabase(ctx);
  t.after(() => {
    if (ctx.sqlite.open) ctx.sqlite.close();
    if (directory) {
      assert.equal(dirname(filename), directory);
      for (const suffix of ["", "-wal", "-shm"])
        rmSync(filename + suffix, { force: true });
      rmdirSync(directory);
    }
  });
  return ctx;
}
const execute = (
  ctx,
  domain,
  command,
  key = crypto.randomUUID(),
  user = owner,
) => executeOperation(domain, command, user, key, ctx, now);
test("SQLite seed is relational, spans months and never overwrites transactions", (t) => {
  const ctx = setup(t);
  const state = loadWorkspace(ctx, owner.id);
  assert.deepEqual(ctx.sqlite.pragma("foreign_key_check"), []);
  assert.ok(
    state.sales.lives.some((live) =>
      live.results.some((row) => row.reason === "Duplikat komentar"),
    ),
  );
  assert.equal(
    reportData(state.warehouse, state.sales, "2026-10").revenue,
    211500,
  );
  assert.equal(
    reportData(state.warehouse, state.sales, "2026-09").revenue,
    162000,
  );
  assert.equal(
    reportData(state.warehouse, state.sales, "2026-11").revenue,
    280000,
  );
  for (const customer of state.sales.customers)
    assert.equal(
      state.sales.deposits
        .filter((row) => row.customerId === customer.id)
        .reduce((sum, row) => sum + row.amount, 0),
      customer.depositBalance,
    );
  execute(ctx, "settings", { type: "save-discount", percent: 17.5 });
  assert.equal(seedDatabase(ctx), false);
  assert.equal(loadWorkspace(ctx, owner.id).sales.memberDiscountPercent, 17.5);
});
test("five role logins use hashed expiring revocable sessions and persistent rate limits", (t) => {
  const ctx = setup(t);
  const at = Date.parse(now);
  for (const account of demoAccounts) {
    const result = login(account.username, account.password, "test", ctx, at);
    assert.equal(result.user.role, account.role);
    assert.equal(sessionUser(result.token, ctx, at)?.id, result.user.id);
    assert.equal(sessionUser(result.token, ctx, at + 9 * 3600000), null);
    assert.equal(
      ctx.sqlite
        .prepare("select count(*) as total from sessions where id = ?")
        .get(result.token).total,
      0,
    );
    logout(result.token, ctx);
    assert.equal(sessionUser(result.token, ctx, at), null);
  }
  const hash = ctx.sqlite
    .prepare("select password_hash from users where username='zahra'")
    .get().password_hash;
  assert.ok(hash.startsWith("scrypt:"));
  assert.ok(checkPassword("OwnerDemo!2026", hash));
  assert.ok(!checkPassword("bad", hash));
  for (let i = 0; i < 5; i++)
    assert.throws(
      () => login("zahra", "bad", "limit", ctx, at),
      (error) => error.status === 401,
    );
  assert.throws(
    () => login("zahra", "OwnerDemo!2026", "limit", ctx, at),
    (error) => error.status === 429,
  );
  assert.ok(
    login("zahra", "OwnerDemo!2026", "limit", ctx, at + 16 * 60000).token,
  );
});
test("role projections and write permissions do not trust requested role or expose finances", (t) => {
  const ctx = setup(t);
  const state = loadWorkspace(ctx, owner.id);
  const host = visibleWorkspace(state, {
    ...owner,
    id: "user-host",
    role: "live-host",
  });
  assert.ok(host.sales.lives.length);
  assert.ok(host.sales.lives.every((live) => live.hostId === "user-host"));
  assert.equal(host.sales.orders.length, 0);
  assert.equal(host.sales.customers.length, 0);
  assert.equal(host.payments.attempts.length, 0);
  assert.ok(host.sales.lives.every((live) => live.results.length === 0));
  assert.deepEqual(host.settings.priceRules, {});
  const packing = visibleWorkspace(state, {
    ...owner,
    id: "user-packing",
    role: "packing",
  });
  assert.ok(packing.sales.orders.length);
  assert.ok(
    packing.sales.orders.every(
      (order) => order.paymentStatus === "approved" && order.total === 0,
    ),
  );
  assert.ok(packing.warehouse.items.every((item) => item.price === null));
  const sorter = visibleWorkspace(state, { ...owner, role: "penyortir" });
  assert.ok(sorter.warehouse.items.length);
  assert.equal(sorter.sales.orders.length, 0);
  for (const role of ["packing", "penyortir", "live-host"])
    assert.throws(
      () =>
        execute(
          ctx,
          "settings",
          { type: "save-discount", percent: 20 },
          crypto.randomUUID(),
          { ...owner, role },
        ),
      (error) => error.status === 403,
    );
  assert.throws(
    () =>
      execute(ctx, "payments", {
        type: "approve",
        paymentId: "payment-fajar",
        role: "owner",
      }),
    (error) => error.name === "ZodError",
  );
});
test("payment, packing, dispatch and monthly counts stay atomic and replay safe", (t) => {
  const ctx = setup(t);
  const original = loadWorkspace(ctx, owner.id);
  const october = reportData(original.warehouse, original.sales, "2026-10");
  const key = crypto.randomUUID();
  let result = execute(
    ctx,
    "payments",
    { type: "approve", paymentId: "payment-fajar" },
    key,
  );
  const replay = execute(
    ctx,
    "payments",
    { type: "approve", paymentId: "payment-fajar" },
    key,
  );
  assert.equal(replay.replayed, true);
  assert.equal(
    result.state.sales.customers.find((row) => row.id === "customer-fajar")
      .depositBalance,
    315500,
  );
  assert.equal(
    result.state.sales.deposits.filter(
      (row) => row.id === "payment-debit-payment-fajar",
    ).length,
    1,
  );
  assert.throws(
    () =>
      execute(ctx, "payments", { type: "approve", paymentId: "payment-fajar" }),
    (error) => error.status === 409,
  );
  assert.throws(
    () =>
      execute(ctx, "payments", { type: "approve", paymentId: "payment-sari" }),
    /Nominal/,
  );
  let report = reportData(
    result.state.warehouse,
    result.state.sales,
    "2026-11",
  );
  assert.equal(report.sold.length, 4);
  assert.equal(report.sold.filter((row) => row.outboundAt).length, 1);
  assert.equal(report.revenue, 343000);
  execute(ctx, "shipping", {
    type: "save-checklist",
    orderId: "ORD-261121-002",
    checklist: {
      pickedItemIds: ["ZR-2610-0017"],
      codeMatches: true,
      conditionMatches: true,
      packed: true,
    },
  });
  execute(ctx, "shipping", { type: "mark-packed", orderId: "ORD-261121-002" });
  result = execute(ctx, "shipping", {
    type: "dispatch",
    orderId: "ORD-261121-002",
    courier: "JNE",
    trackingNumber: "TEST-TRACK-001",
    handedOver: true,
  });
  assert.equal(
    result.state.warehouse.items.find((row) => row.id === "ZR-2610-0017")
      .locationId,
    null,
  );
  report = reportData(result.state.warehouse, result.state.sales, "2026-11");
  assert.equal(report.sold.length, 4);
  assert.equal(report.sold.filter((row) => row.outboundAt).length, 2);
  assert.equal(report.revenue, 343000);
  const delivered = execute(ctx, "shipping", {
    type: "update-tracking",
    orderId: "ORD-261121-002",
    status: "delivered",
    description: "Diterima pembeli, konfirmasi petugas",
  });
  assert.equal(
    delivered.state.sales.orders.find((row) => row.id === "ORD-261121-002")
      .status,
    "completed",
  );
  assert.equal(
    reportData(delivered.state.warehouse, delivered.state.sales, "2026-11")
      .revenue,
    343000,
  );
  assert.throws(
    () =>
      execute(ctx, "shipping", {
        type: "update-tracking",
        orderId: "ORD-261121-002",
        status: "delivered",
        description: "Duplikat",
      }),
    /dalam pengiriman/,
  );
  execute(ctx, "settings", { type: "save-discount", percent: 25 });
  const latest = loadWorkspace(ctx, owner.id);
  assert.deepEqual(
    reportData(latest.warehouse, latest.sales, "2026-10"),
    october,
  );
  assert.deepEqual(ctx.sqlite.pragma("foreign_key_check"), []);
});
test("claim sources and millisecond winners persist; repeat imports cannot sell stock twice", (t) => {
  const ctx = setup(t);
  const csv =
    "@dodi_ootd,ZR-2609-0008,19:24:03.480\n@rina.thrift,ZR-2609-0008,19:24:03.120\n@rina.thrift,ZR-2609-0008,19:24:03.120\ninvalid";
  const result = execute(ctx, "sales", {
    type: "process-claims",
    liveId: "live-261123",
    text: csv,
  });
  const order = result.state.sales.orders.find((order) =>
    order.itemIds.includes("ZR-2609-0008"),
  );
  assert.equal(order.customerId, "customer-rina");
  assert.equal(order.total, 103500);
  assert.equal(
    ctx.sqlite
      .prepare(
        "select raw_text from claim_batches where live_id='live-261123' and status='processed'",
      )
      .get().raw_text,
    csv,
  );
  assert.equal(
    ctx.sqlite
      .prepare(
        "select milliseconds from claims where live_id='live-261123' and outcome='won'",
      )
      .get().milliseconds,
    69843120,
  );
  assert.throws(
    () =>
      execute(ctx, "sales", {
        type: "process-claims",
        liveId: "live-261123",
        text: csv,
      }),
    /sudah diproses/,
  );
  const before = loadWorkspace(ctx, owner.id);
  assert.throws(
    () =>
      execute(ctx, "settings", {
        type: "add-location",
        code: "R01-S01",
        description: "duplicate",
      }),
    /sudah digunakan/,
  );
  assert.deepEqual(loadWorkspace(ctx, owner.id).sales, before.sales);
});
test(
  "separate SQLite connections serialize simultaneous duplicate approvals and survive reopening",
  { timeout: 20000 },
  async (t) => {
    const ctx = setup(t, true);
    const path = ctx.path;
    const workers = [0, 1].map(
      () =>
        new Worker(new URL("./helpers/operation-worker.mjs", import.meta.url), {
          workerData: { path, user: owner, key: "parallel_approval_test", now },
        }),
    );
    t.after(() => Promise.all(workers.map((worker) => worker.terminate())));
    await Promise.all(
      workers.map(
        (worker) =>
          new Promise((resolve, reject) => {
            worker.once("message", (message) =>
              message === "ready" ? resolve() : reject(message),
            );
            worker.once("error", reject);
          }),
      ),
    );
    const answers = workers.map(
      (worker) =>
        new Promise((resolve, reject) => {
          worker.once("message", resolve);
          worker.once("error", reject);
        }),
    );
    workers.forEach((worker) => worker.postMessage("go"));
    const results = await Promise.all(answers);
    assert.ok(
      results.every((result) => result.ok),
      JSON.stringify(results),
    );
    assert.equal(results.filter((result) => result.replayed).length, 1);
    const other = openDatabase(path);
    try {
      const state = loadWorkspace(other, owner.id);
      assert.equal(
        state.sales.customers.find((row) => row.id === "customer-fajar")
          .depositBalance,
        315500,
      );
      assert.equal(
        state.sales.deposits.filter(
          (row) => row.id === "payment-debit-payment-fajar",
        ).length,
        1,
      );
    } finally {
      other.sqlite.close();
    }
  },
);
test("Gemini extraction never supplies an inferred timestamp to winner processing", () => {
  const csv = extractionCsv({
    rows: [
      {
        handle: "@rina.thrift",
        itemCode: "ZR-2609-0008",
        time: "19:24:03.120",
        uncertain: false,
      },
      {
        handle: "@dodi_ootd",
        itemCode: "ZR-2609-0008",
        time: null,
        uncertain: true,
      },
    ],
  });
  const rows = parseClaims(csv);
  assert.equal(rows[0].milliseconds, 69843120);
  assert.ok(rows[1].error);
  assert.equal(rows[1].milliseconds, null);
  assert.throws(() => extractionCsv({ rows: [{ handle: "x" }] }));
});

test("insufficient deposit rolls back approval and zero-total orders can be paid", (t) => {
  const ctx = setup(t);
  const sari = loadWorkspace(ctx, owner.id).sales.orders.find(
    (row) => row.customerId === "customer-sari",
  );
  execute(ctx, "payments", {
    type: "reject",
    paymentId: "payment-sari",
    reason: "Nominal tidak sesuai",
  });
  const submitted = execute(ctx, "payments", {
    type: "submit",
    orderId: sari.id,
    method: "deposit",
    amount: sari.total,
  });
  const before = loadWorkspace(ctx, owner.id);
  assert.throws(
    () =>
      execute(ctx, "payments", {
        type: "approve",
        paymentId: submitted.entityId,
      }),
    /Saldo/,
  );
  assert.deepEqual(loadWorkspace(ctx, owner.id), before);
  execute(ctx, "settings", { type: "save-discount", percent: 100 });
  const claimed = execute(ctx, "sales", {
    type: "process-claims",
    liveId: "live-261123",
    text: "@rina.thrift,ZR-2609-0008,19:24:03.120",
  });
  const free = claimed.state.sales.orders.find((row) =>
    row.itemIds.includes("ZR-2609-0008"),
  );
  assert.equal(free.total, 0);
  const payment = execute(ctx, "payments", {
    type: "submit",
    orderId: free.id,
    method: "deposit",
    amount: 0,
  });
  const paid = execute(ctx, "payments", {
    type: "approve",
    paymentId: payment.entityId,
  });
  assert.equal(
    paid.state.sales.orders.find((row) => row.id === free.id).status,
    "paid",
  );
  assert.equal(
    paid.state.sales.customers.find((row) => row.id === "customer-rina")
      .depositBalance,
    200000,
  );
});

test(
  "simultaneous independent claim imports create one order and preserve earliest millisecond",
  { timeout: 20000 },
  async (t) => {
    const ctx = setup(t, true);
    const command = {
      type: "process-claims",
      liveId: "live-261123",
      text: "@dodi_ootd,ZR-2609-0008,19:24:03.480\n@rina.thrift,ZR-2609-0008,19:24:03.120",
    };
    const workers = [0, 1].map(
      () =>
        new Worker(new URL("./helpers/operation-worker.mjs", import.meta.url), {
          workerData: {
            path: ctx.path,
            user: owner,
            key: crypto.randomUUID(),
            now,
            domain: "sales",
            command,
          },
        }),
    );
    t.after(() => Promise.all(workers.map((worker) => worker.terminate())));
    await Promise.all(
      workers.map(
        (worker) =>
          new Promise((resolve, reject) => {
            worker.once("message", resolve);
            worker.once("error", reject);
          }),
      ),
    );
    const answers = workers.map(
      (worker) =>
        new Promise((resolve, reject) => {
          worker.once("message", resolve);
          worker.once("error", reject);
        }),
    );
    workers.forEach((worker) => worker.postMessage("go"));
    const results = await Promise.all(answers);
    assert.equal(results.filter((row) => row.ok).length, 1);
    assert.match(results.find((row) => !row.ok).error, /sudah diproses/);
    const orders = loadWorkspace(ctx, owner.id).sales.orders.filter((row) =>
      row.itemIds.includes("ZR-2609-0008"),
    );
    assert.equal(orders.length, 1);
    assert.equal(orders[0].customerId, "customer-rina");
    assert.deepEqual(ctx.sqlite.pragma("foreign_key_check"), []);
  },
);

test("strategy recipients and selectable hosts come from active database users", (t) => {
  const ctx = setup(t);
  const state = loadWorkspace(ctx, owner.id);
  assert.ok(state.directory.some((row) => row.id === "host-claudia"));
  assert.doesNotMatch(JSON.stringify(state), /scrypt:/);
  const sent = execute(ctx, "reports", {
    type: "send-strategy",
    strategyId: "strategy-2026-12",
    recipientIds: ["host-claudia"],
  });
  assert.deepEqual(
    sent.state.reports.strategies.find((row) => row.id === "strategy-2026-12")
      .recipientIds,
    ["host-claudia"],
  );
  assert.ok(
    visibleWorkspace(sent.state, {
      ...owner,
      id: "host-claudia",
      role: "live-host",
    }).reports.strategies.some((row) => row.id === "strategy-2026-12"),
  );
  assert.ok(
    !visibleWorkspace(sent.state, {
      ...owner,
      id: "user-host",
      role: "live-host",
    }).reports.strategies.some((row) => row.id === "strategy-2026-12"),
  );
  assert.equal(
    visibleWorkspace(state, { ...owner, role: "packing" }).directory,
    undefined,
  );
  ctx.sqlite.prepare("UPDATE users SET active=0 WHERE id='host-claudia'").run();
  assert.ok(
    !loadWorkspace(ctx, owner.id).directory.some(
      (row) => row.id === "host-claudia",
    ),
  );
  execute(ctx, "reports", {
    type: "save-strategy",
    month: "2027-01",
    content: "Strategi Januari",
  });
  assert.throws(
    () =>
      execute(ctx, "reports", {
        type: "send-strategy",
        strategyId: "strategy-2027-01",
        recipientIds: ["host-claudia"],
      }),
    /staf yang valid/,
  );
});
test("home aggregates share sales metrics and operational queues across month boundaries", (t) => {
  const ctx = setup(t);
  const state = loadWorkspace(ctx, owner.id);
  const home = homeDashboard(owner, now, ctx);
  assert.equal(
    home.soldItems,
    reportData(state.warehouse, state.sales, "2026-11").sold.length,
  );
  assert.equal(home.income, 280000);
  const admin = homeDashboard(
    { ...owner, id: "user-admin", role: "admin" },
    "2026-12-01T00:00:00Z",
    ctx,
  );
  assert.equal(
    admin.payments.pending,
    state.sales.orders.filter((row) => row.paymentStatus === "pending").length,
  );
  assert.equal(
    admin.shipping.inTransit,
    state.sales.orders.filter((row) => row.status === "shipped").length,
  );
  assert.equal(
    admin.readyToShip,
    state.sales.orders.filter((row) => row.status === "packed").length,
  );
  const host = homeDashboard(
    { ...owner, id: "host-claudia", role: "live-host" },
    now,
    ctx,
  );
  assert.ok(host.upcoming.every((row) => row.hostId === "host-claudia"));
});
