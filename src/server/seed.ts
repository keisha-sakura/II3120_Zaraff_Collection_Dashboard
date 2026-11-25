import { eq } from "drizzle-orm";
import { createWarehouseDemo } from "../mocks/data/warehouse-demo.ts";
import { createSalesDemo } from "../mocks/data/sales-demo.ts";
import { createPaymentsDemo } from "../mocks/data/payments-demo.ts";
import { createShippingDemo } from "../mocks/data/shipping-demo.ts";
import { createReportsDemo } from "../mocks/data/reports-demo.ts";
import { createSettingsDemo } from "../mocks/data/settings-demo.ts";
import { mockUsers } from "../mocks/data/users.ts";
import { categories } from "../features/gudang/model.ts";
import { hashPassword } from "./auth-core.ts";
import { saveWorkspace } from "./workspace.ts";
import type { DatabaseContext } from "./db.ts";
import type { Workspace } from "../types/workspace";
import * as t from "./schema.ts";
import { createSmallWorkspace } from "./seed-small.ts";

export const demoAccounts = [
  { role: "owner", username: "zahra", password: "OwnerDemo!2026" },
  { role: "admin", username: "keisha", password: "AdminDemo!2026" },
  { role: "penyortir", username: "jojo", password: "SortirDemo!2026" },
  { role: "live-host", username: "nadia", password: "HostDemo!2026" },
  { role: "packing", username: "rizky", password: "PackingDemo!2026" },
] as const;
export function seedDatabase(
  ctx: DatabaseContext,
  profile: "demo" | "small" = "demo",
) {
  if (
    ctx.orm
      .select()
      .from(t.settings)
      .where(eq(t.settings.id, "seed-version"))
      .get()
  )
    return false;
  if (
    ctx.orm.select().from(t.users).get() ||
    ctx.orm.select().from(t.items).get()
  )
    throw new Error("Database sudah berisi data. Seed tidak akan menimpanya.");
  const prepared = createSalesDemo(createWarehouseDemo());
  const data = createPaymentsDemo(prepared.sales, prepared.warehouse, true);
  const state: Workspace =
    profile === "small"
      ? createSmallWorkspace()
      : {
          version: 1,
          ...data,
          shipping: createShippingDemo(data.sales),
          reports: createReportsDemo(),
          settings: createSettingsDemo(),
        };
  if (profile === "demo") {
    // Additional historical sales make monthly reports usable without fake totals.
    for (const [index, month, category, price] of [
      [1, "2026-09", "Jaket", 180000],
      [2, "2026-10", "Hoodie", 150000],
      [3, "2026-10", "Kemeja", 85000],
    ] as const) {
      const itemId = `ZR-${month.slice(2).replace("-", "")}-09${String(index).padStart(2, "0")}`;
      const orderId = `ORD-${month.slice(2).replace("-", "")}15-09${index}`;
      const soldAt = `${month}-15T10:00:00+07:00`;
      state.warehouse.items.push({
        ...state.warehouse.items[0],
        id: itemId,
        category,
        grade: "A",
        price,
        status: "outbound",
        locationId: null,
        availableAt: `${month}-01T09:00:00+07:00`,
        sortedAt: `${month}-01T08:00:00+07:00`,
        laundryAt: `${month}-01T08:00:00+07:00`,
        baleId: "BL-260731-001",
        soldAt,
        outboundAt: `${month}-16T10:00:00+07:00`,
        orderId,
      });
      state.sales.orders.push({
        id: orderId,
        customerId: "customer-rina",
        itemIds: [itemId],
        lines: [{ itemId, category, grade: "A", price }],
        subtotal: price,
        memberDiscount: Math.round(price * 0.1),
        total: Math.round(price * 0.9),
        createdAt: soldAt,
        status: "completed",
        paymentStatus: "approved",
        liveId: null,
        shipment: {
          id: `ship-${orderId}`,
          orderId,
          courier: "JNE",
          trackingNumber: `SEED${month.replace("-", "")}${index}`,
          handedOverAt: `${month}-16T10:00:00+07:00`,
          status: "delivered",
          events: [
            {
              title: "Diterima Pembeli",
              dateTime: `${month}-18T10:00:00+07:00`,
              description: "Penerima: Rina",
            },
          ],
        },
      });
    }
    // Future live assigned to a second host verifies assignment-level isolation.
    state.sales.lives.push({
      ...state.sales.lives[0],
      id: "live-claudia",
      title: "Live Claudia",
      hostId: "host-claudia",
      status: "published",
      scheduledAt: "2026-12-03T19:00:00+07:00",
      itemIds: [],
      results: [],
      claimsProcessed: false,
    });
    const rejectedLive = state.sales.lives.find(
      (live) => live.id === "live-261121",
    )!;
    rejectedLive.results.push(
      {
        id: "seed-duplicate",
        line: 90,
        handle: "@dodi_ootd",
        itemCode: "ZR-2610-0011",
        time: "19:23:00.500",
        milliseconds: 69780500,
        error: null,
        outcome: "rejected",
        reason: "Kalah cepat dari pembeli pertama",
        orderId: null,
      },
      {
        id: "seed-invalid",
        line: 91,
        handle: "@invalid",
        itemCode: "BAD",
        time: "—",
        milliseconds: null,
        error: "Format kode tidak valid",
        outcome: "invalid",
        reason: "Format kode tidak valid",
        orderId: null,
      },
    );
    rejectedLive.results.push({
      ...rejectedLive.results[0],
      id: "seed-repeated-comment",
      line: 92,
      outcome: "rejected",
      reason: "Duplikat komentar",
      orderId: null,
    });
    state.reports.strategies.push({
      id: "strategy-2026-12",
      month: "2026-12",
      content:
        "Prioritaskan stok berumur lebih dari 60 hari dan jadwal live akhir tahun.",
      authorId: "user-owner",
      authorName: "Zahra",
      createdAt: "2026-11-24T09:00:00+07:00",
      sentAt: null,
      recipientIds: [],
    });
  }
  for (const customer of state.sales.customers) {
    const sum = state.sales.deposits
      .filter((row) => row.customerId === customer.id)
      .reduce((sum, row) => sum + row.amount, 0);
    if (sum !== customer.depositBalance)
      state.sales.deposits.push({
        id: `opening-${customer.id}`,
        customerId: customer.id,
        amount: customer.depositBalance - sum,
        description: "Saldo awal dan top up",
        occurredAt: "2026-08-01T00:00:00+07:00",
      });
  }
  if (profile === "demo") {
    const completed = createPaymentsDemo(state.sales, state.warehouse);
    state.payments = completed.payments;
    state.shipping = createShippingDemo(state.sales);
  }
  ctx.sqlite
    .transaction(() => {
      for (const user of mockUsers) {
        const account = demoAccounts.find(
          (account) => account.role === user.role,
        )!;
        ctx.orm
          .insert(t.users)
          .values({
            ...user,
            username: account.username,
            passwordHash: hashPassword(
              process.env[
                `SEED_PASSWORD_${user.role.replace("-", "_").toUpperCase()}`
              ] ?? account.password,
            ),
          })
          .run();
      }
      if (profile === "demo")
        ctx.orm
          .insert(t.users)
          .values({
            id: "host-claudia",
            username: "claudia",
            name: "Claudia",
            email: "claudia@zaraff.id",
            role: "live-host",
            active: true,
            passwordHash: hashPassword(
              process.env.SEED_PASSWORD_CLAUDIA ?? "HostClaudia!2026",
            ),
          })
          .run();
      for (const category of categories)
        ctx.orm.insert(t.categories).values({ id: category }).run();
      saveWorkspace(ctx, state, "user-owner");
      for (const item of state.warehouse.items) {
        const snapshots = [
          {
            at: item.sortedAt,
            status: "laundry",
            grade: null,
            price: null,
            locationId: null,
          },
          ...(item.availableAt
            ? [
                {
                  at: item.availableAt,
                  status: "available",
                  grade: item.grade,
                  price: item.price,
                  locationId: item.locationId,
                },
              ]
            : []),
          ...(item.status === "reserved"
            ? [
                {
                  at:
                    state.sales.orders.find(
                      (order) => order.id === item.orderId,
                    )?.createdAt ?? item.sortedAt,
                  status: "reserved",
                  grade: item.grade,
                  price: item.price,
                  locationId: item.locationId,
                },
              ]
            : []),
          ...(item.soldAt
            ? [
                {
                  at: item.soldAt,
                  status: "sold",
                  grade: item.grade,
                  price: item.price,
                  locationId: item.locationId,
                },
              ]
            : []),
          ...(item.outboundAt
            ? [
                {
                  at: item.outboundAt,
                  status: "outbound",
                  grade: item.grade,
                  price: item.price,
                  locationId: null,
                },
              ]
            : []),
        ];
        snapshots.sort((a, b) => a.at.localeCompare(b.at));
        for (const [index, snapshot] of snapshots.entries())
          ctx.orm
            .insert(t.inventoryHistory)
            .values({
              id: `history-${item.id}-${index}`,
              itemId: item.id,
              occurredAt: new Date(snapshot.at).toISOString(),
              status: snapshot.status,
              grade: snapshot.grade,
              price: snapshot.price,
              locationId: snapshot.locationId,
              actorId: "user-owner",
            })
            .run();
      }
      ctx.orm.insert(t.settings).values({ id: "seed-version", value: 1 }).run();
      ctx.orm
        .insert(t.settings)
        .values([
          { id: "monthly-sale-target", value: 20 },
          { id: "monthly-revenue-target", value: 2500000 },
        ])
        .run();
    })
    .immediate();
  return true;
}
