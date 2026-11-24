import { createHash, randomUUID } from "node:crypto";
import { eq, getTableColumns, type InferInsertModel } from "drizzle-orm";
import type { SQLiteTable, SQLiteColumn } from "drizzle-orm/sqlite-core";
import type { DatabaseContext } from "./db.ts";
import * as t from "./schema.ts";
import type { Workspace } from "../types/workspace";
import type { User } from "../types/domain";

export const digest = (text: string) =>
  createHash("sha256").update(text).digest("hex");
export function loadWorkspace(ctx: DatabaseContext, userId: string): Workspace {
  const db = ctx.orm;
  const allItems = db.select().from(t.items).all();
  const orderLines = db
    .select()
    .from(t.orderLines)
    .all()
    .sort((a, b) => a.position - b.position);
  const liveItems = db.select().from(t.liveItems).all();
  const claims = db.select().from(t.claims).all();
  const suppliers = db.select().from(t.suppliers).all();
  const shipments = db.select().from(t.shipments).all();
  const events = db.select().from(t.shipmentEvents).all();
  const invoiceEvents = db.select().from(t.invoiceEvents).all();
  const picked = db.select().from(t.pickedItems).all();
  const recipients = db.select().from(t.strategyRecipients).all();
  const rules = db.select().from(t.priceRules).all();
  const config = db.select().from(t.settings).all();
  return {
    version: 1,
    directory: db
      .select()
      .from(t.users)
      .all()
      .filter((row) => row.active)
      .map(({ id, name, email, role }) => ({ id, name, email, role })),
    warehouse: {
      version: 1,
      items: allItems,
      bales: db
        .select()
        .from(t.bales)
        .all()
        .map(({ supplierId, ...bale }) => ({
          ...bale,
          supplier: suppliers.find((row) => row.id === supplierId)!.name,
        })),
      locations: db.select().from(t.locations).all(),
      returns: db.select().from(t.returns).all(),
      movements: db
        .select()
        .from(t.movements)
        .all()
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
      history: db.select().from(t.inventoryHistory).all(),
    },
    sales: {
      version: 1,
      customers: db.select().from(t.customers).all(),
      orders: db
        .select()
        .from(t.orders)
        .all()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((order) => {
          const shipment = shipments.find((row) => row.orderId === order.id);
          const lines = orderLines
            .filter((row) => row.orderId === order.id)
            .map(({ itemId, category, grade, price }) => ({
              itemId,
              category,
              grade,
              price,
            }));
          return {
            ...order,
            itemIds: lines.map((line) => line.itemId),
            lines,
            shipment: shipment
              ? {
                  ...shipment,
                  events: events
                    .filter((row) => row.shipmentId === shipment.id)
                    .sort((a, b) => b.dateTime.localeCompare(a.dateTime))
                    .map(({ title, dateTime, description }) => ({
                      title,
                      dateTime,
                      description,
                    })),
                }
              : null,
          };
        }),
      lives: db
        .select()
        .from(t.lives)
        .all()
        .map((live) => ({
          ...live,
          itemIds: liveItems
            .filter((row) => row.liveId === live.id)
            .map((row) => row.itemId),
          results: claims
            .filter((row) => row.liveId === live.id)
            .sort((a, b) => a.line - b.line)
            .map(({ batchId: _batchId, liveId: _liveId, ...claim }) => claim),
        })),
      deposits: db
        .select()
        .from(t.deposits)
        .all()
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
      draft:
        db.select().from(t.drafts).where(eq(t.drafts.userId, userId)).get()
          ?.data ?? null,
      memberDiscountPercent: Number(
        config.find((row) => row.id === "member-discount")?.value ?? 10,
      ),
    },
    payments: {
      version: 1,
      attempts: db.select().from(t.payments).all(),
      invoices: db
        .select()
        .from(t.invoices)
        .all()
        .map((invoice) => ({
          ...invoice,
          events: invoiceEvents
            .filter((row) => row.invoiceId === invoice.id)
            .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
            .map(({ invoiceId: _invoiceId, ...event }) => event),
        })),
    },
    shipping: {
      version: 1,
      packing: db
        .select()
        .from(t.packing)
        .all()
        .map(({ orderId, packedAt, packedBy, ...checks }) => ({
          orderId,
          packedAt,
          packedBy,
          checklist: {
            ...checks,
            pickedItemIds: picked
              .filter((row) => row.orderId === orderId)
              .map((row) => row.itemId),
          },
        })),
    },
    reports: {
      version: 1,
      strategies: db
        .select()
        .from(t.strategies)
        .all()
        .map((strategy) => ({
          ...strategy,
          recipientIds: recipients
            .filter((row) => row.strategyId === strategy.id)
            .map((row) => row.userId),
        })),
    },
    settings: {
      version: 1,
      priceRules: Object.fromEntries(
        [...new Set(rules.map((row) => row.category))].map((category) => [
          category,
          Object.fromEntries(
            rules
              .filter((row) => row.category === category)
              .map((row) => [row.grade, row.price]),
          ),
        ]),
      ),
    },
  } as Workspace;
}

export function saveWorkspace(
  ctx: DatabaseContext,
  state: Workspace,
  userId: string,
) {
  const db = ctx.orm;
  function upsert<T extends SQLiteTable>(
    table: T,
    rows: InferInsertModel<T>[],
    target?: SQLiteColumn | SQLiteColumn[],
  ) {
    for (const row of rows)
      db.insert(table as SQLiteTable)
        .values(
          Object.fromEntries(
            Object.entries(row).map(([key, value]) => [
              key,
              typeof value === "string" &&
              /(At|Time)$/.test(key) &&
              Number.isFinite(Date.parse(value))
                ? new Date(value).toISOString()
                : value,
            ]),
          ),
        )
        .onConflictDoUpdate({
          target: target ?? getTableColumns(table).id,
          set: Object.fromEntries(
            Object.entries(row).map(([key, value]) => [
              key,
              typeof value === "string" &&
              /(At|Time)$/.test(key) &&
              Number.isFinite(Date.parse(value))
                ? new Date(value).toISOString()
                : value,
            ]),
          ),
        })
        .run();
  }
  upsert(
    t.categories,
    [...new Set(state.warehouse.items.map((item) => item.category))].map(
      (id) => ({ id }),
    ),
  );
  upsert(
    t.grades,
    ["A", "B", "C"].map((id) => ({ id })),
  );
  upsert(
    t.suppliers,
    [...new Set(state.warehouse.bales.map((bale) => bale.supplier))].map(
      (name) => ({ id: digest(name.toLowerCase()).slice(0, 24), name }),
    ),
  );
  upsert(t.locations, state.warehouse.locations);
  upsert(
    t.bales,
    state.warehouse.bales.map(({ supplier, ...bale }) => ({
      ...bale,
      supplierId: digest(supplier.toLowerCase()).slice(0, 24),
    })),
  );
  upsert(t.customers, state.sales.customers);
  upsert(
    t.lives,
    state.sales.lives.map(
      ({ itemIds: _itemIds, results: _results, ...live }) => live,
    ),
  );
  upsert(
    t.orders,
    state.sales.orders.map(
      ({ itemIds: _itemIds, lines: _lines, shipment: _shipment, ...order }) =>
        order,
    ),
  );
  upsert(t.items, state.warehouse.items);
  upsert(
    t.orderLines,
    state.sales.orders.flatMap((order) =>
      order.lines.map((line, position) => ({
        ...line,
        orderId: order.id,
        position,
      })),
    ),
    [t.orderLines.orderId, t.orderLines.itemId],
  );
  for (const live of state.sales.lives) {
    db.delete(t.liveItems).where(eq(t.liveItems.liveId, live.id)).run();
    for (const itemId of live.itemIds)
      db.insert(t.liveItems).values({ liveId: live.id, itemId }).run();
  }
  upsert(t.returns, state.warehouse.returns);
  upsert(t.movements, state.warehouse.movements);
  upsert(t.deposits, state.sales.deposits);
  upsert(
    t.priceRules,
    Object.entries(state.settings.priceRules).flatMap(([category, prices]) =>
      Object.entries(prices).map(([grade, price]) => ({
        category,
        grade,
        price,
      })),
    ),
    [t.priceRules.category, t.priceRules.grade],
  );
  upsert(t.settings, [
    { id: "member-discount", value: state.sales.memberDiscountPercent },
  ]);
  upsert(
    t.invoices,
    state.payments.invoices.map(({ events: _events, ...invoice }) => invoice),
  );
  upsert(
    t.invoiceEvents,
    state.payments.invoices.flatMap((invoice) =>
      invoice.events.map((event) => ({ ...event, invoiceId: invoice.id })),
    ),
  );
  upsert(t.payments, state.payments.attempts);
  upsert(
    t.packing,
    state.shipping.packing.map(({ checklist, ...record }) => ({
      ...record,
      codeMatches: checklist.codeMatches,
      conditionMatches: checklist.conditionMatches,
      packed: checklist.packed,
    })),
    t.packing.orderId,
  );
  for (const record of state.shipping.packing) {
    db.delete(t.pickedItems)
      .where(eq(t.pickedItems.orderId, record.orderId))
      .run();
    for (const itemId of record.checklist.pickedItemIds)
      db.insert(t.pickedItems)
        .values({ orderId: record.orderId, itemId })
        .run();
  }
  upsert(
    t.shipments,
    state.sales.orders.flatMap((order) =>
      order.shipment
        ? [(({ events: _events, ...shipment }) => shipment)(order.shipment)]
        : [],
    ),
  );
  upsert(
    t.shipmentEvents,
    state.sales.orders.flatMap((order) =>
      order.shipment
        ? order.shipment.events.map((event) => ({
            ...event,
            id: digest(`${order.shipment!.id}:${JSON.stringify(event)}`),
            shipmentId: order.shipment!.id,
          }))
        : [],
    ),
  );
  upsert(
    t.strategies,
    state.reports.strategies.map(
      ({ recipientIds: _recipientIds, ...strategy }) => strategy,
    ),
  );
  for (const strategy of state.reports.strategies) {
    db.delete(t.strategyRecipients)
      .where(eq(t.strategyRecipients.strategyId, strategy.id))
      .run();
    for (const recipientId of strategy.recipientIds)
      db.insert(t.strategyRecipients)
        .values({ strategyId: strategy.id, userId: recipientId })
        .run();
  }
  db.delete(t.drafts).where(eq(t.drafts.userId, userId)).run();
  if (state.sales.draft)
    db.insert(t.drafts).values({ userId, data: state.sales.draft }).run();
  for (const live of state.sales.lives.filter((live) => live.results.length)) {
    let batch = db
      .select()
      .from(t.claimBatches)
      .where(eq(t.claimBatches.liveId, live.id))
      .all()
      .find((batch) => batch.status === "processed");
    if (!batch) {
      const rawText = live.results
        .map((row) => `${row.handle},${row.itemCode},${row.time}`)
        .join("\n");
      db.insert(t.claimBatches)
        .values({
          id: `seed-${live.id}`,
          liveId: live.id,
          actorId: userId,
          source: "seed",
          sourceHash: digest(rawText),
          rawText,
          status: "processed",
          createdAt: new Date(live.scheduledAt).toISOString(),
        })
        .run();
      batch = db
        .select()
        .from(t.claimBatches)
        .where(eq(t.claimBatches.id, `seed-${live.id}`))
        .get()!;
    }
    upsert(
      t.claims,
      live.results.map((row) => ({
        ...row,
        liveId: live.id,
        batchId: batch!.id,
      })),
    );
  }
}

export function recordInventoryHistory(
  ctx: DatabaseContext,
  before: Workspace | undefined,
  after: Workspace,
  actorId: string,
  now: string,
) {
  for (const item of after.warehouse.items) {
    const old = before?.warehouse.items.find((row) => row.id === item.id);
    if (
      old &&
      old.status === item.status &&
      old.grade === item.grade &&
      old.price === item.price &&
      old.locationId === item.locationId
    )
      continue;
    ctx.orm
      .insert(t.inventoryHistory)
      .values({
        id: randomUUID(),
        itemId: item.id,
        occurredAt: now,
        status: item.status,
        grade: item.grade,
        price: item.price,
        locationId: item.locationId,
        actorId,
      })
      .run();
  }
}

export function visibleWorkspace(state: Workspace, user: User): Workspace {
  if (user.role === "owner" || user.role === "admin") return state;
  const result: Workspace = {
    version: 1,
    warehouse: {
      version: 1,
      items: [],
      bales: [],
      locations: [],
      returns: [],
      movements: [],
    },
    sales: {
      version: 1,
      customers: [],
      orders: [],
      lives: [],
      deposits: [],
      draft: null,
      memberDiscountPercent: 0,
    },
    payments: { version: 1, attempts: [], invoices: [] },
    shipping: { version: 1, packing: [] },
    reports: {
      version: 1,
      strategies: state.reports.strategies.filter(
        (row) => row.sentAt && row.recipientIds.includes(user.id),
      ),
    },
    settings:
      user.role === "penyortir"
        ? state.settings
        : { version: 1, priceRules: {} as Workspace["settings"]["priceRules"] },
  };
  if (user.role === "penyortir") result.warehouse = state.warehouse;
  if (user.role === "live-host")
    result.sales.lives = state.sales.lives
      .filter((live) => live.hostId === user.id)
      .map((live) => ({ ...live, results: [] }));
  if (user.role === "packing") {
    const orders = state.sales.orders.filter(
      (order) => order.paymentStatus === "approved",
    );
    const ids = new Set(orders.flatMap((order) => order.itemIds));
    result.sales.orders = orders.map((order) => ({
      ...order,
      subtotal: 0,
      total: 0,
      memberDiscount: 0,
      lines: order.lines.map((line) => ({ ...line, price: 0 })),
      shipment: null,
    }));
    result.sales.customers = state.sales.customers
      .filter((customer) =>
        orders.some((order) => order.customerId === customer.id),
      )
      .map((customer) => ({ ...customer, phone: "", depositBalance: 0 }));
    result.warehouse.items = state.warehouse.items
      .filter((item) => ids.has(item.id))
      .map((item) => ({ ...item, price: null }));
    result.shipping.packing = state.shipping.packing.filter((row) =>
      orders.some((order) => order.id === row.orderId),
    );
  }
  return result;
}
