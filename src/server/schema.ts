import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/sqlite-core";
const id = () => text("id").primaryKey();
const money = (name: string) => integer(name).notNull();

export const users = sqliteTable(
  "users",
  {
    id: id(),
    username: text("username").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    role: text("role", {
      enum: ["owner", "admin", "penyortir", "live-host", "packing"],
    }).notNull(),
    passwordHash: text("password_hash").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [
    check(
      "user_role",
      sql`${t.role} in ('owner','admin','penyortir','live-host','packing')`,
    ),
  ],
);
export const sessions = sqliteTable(
  "sessions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("session_user").on(t.userId)],
);
export const loginLimits = sqliteTable("login_limits", {
  id: id(),
  failures: integer("failures").notNull(),
  windowAt: integer("window_at").notNull(),
  lockedUntil: integer("locked_until").notNull(),
});
export const categories = sqliteTable("categories", { id: id() });
export const grades = sqliteTable("grades", { id: id() });
export const suppliers = sqliteTable("suppliers", {
  id: id(),
  name: text("name").notNull().unique(),
});
export const locations = sqliteTable(
  "locations",
  {
    id: id(),
    code: text("code").notNull().unique(),
    description: text("description").notNull(),
    kind: text("kind", { enum: ["bale", "rack"] }).notNull(),
  },
  (t) => [check("location_kind", sql`${t.kind} in ('bale','rack')`)],
);
export const bales = sqliteTable(
  "bales",
  {
    id: id(),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    category: text("category").notNull(),
    weightKg: real("weight_kg").notNull(),
    estimatedItems: integer("estimated_items").notNull(),
    receivedAt: text("received_at").notNull(),
    locationId: text("location_id").references(() => locations.id),
    status: text("status").notNull(),
    receivedBy: text("received_by").notNull(),
  },
  (t) => [
    check("bale_status", sql`${t.status} in ('stored','sorting','sorted')`),
    index("bale_location").on(t.locationId),
  ],
);
export const customers = sqliteTable(
  "customers",
  {
    id: id(),
    name: text("name").notNull(),
    handle: text("handle").notNull().unique(),
    phone: text("phone").notNull(),
    isMember: integer("is_member", { mode: "boolean" }).notNull(),
    depositBalance: money("deposit_balance"),
    joinedAt: text("joined_at").notNull(),
  },
  (t) => [check("balance_nonnegative", sql`${t.depositBalance} >= 0`)],
);
export const lives = sqliteTable(
  "lives",
  {
    id: id(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    scheduledAt: text("scheduled_at").notNull(),
    platform: text("platform").notNull(),
    hostId: text("host_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull(),
    claimsProcessed: integer("claims_processed", { mode: "boolean" }).notNull(),
    promotionChannels: text("promotion_channels", { mode: "json" })
      .$type<string[]>()
      .notNull(),
  },
  (t) => [
    index("live_host_date").on(t.hostId, t.scheduledAt),
    check("live_status", sql`${t.status} in ('draft','published','completed')`),
  ],
);
export const orders = sqliteTable(
  "orders",
  {
    id: id(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    liveId: text("live_id").references(() => lives.id),
    createdAt: text("created_at").notNull(),
    subtotal: money("subtotal"),
    memberDiscount: money("member_discount"),
    total: money("total"),
    status: text("status").notNull(),
    paymentStatus: text("payment_status").notNull(),
  },
  (t) => [
    check(
      "order_money",
      sql`${t.subtotal} >= 0 and ${t.memberDiscount} >= 0 and ${t.total} = ${t.subtotal} - ${t.memberDiscount} and ${t.total} >= 0`,
    ),
    check(
      "order_status",
      sql`${t.status} in ('awaiting-payment','paid','packed','shipped','completed')`,
    ),
    check(
      "order_payment",
      sql`${t.paymentStatus} in ('unpaid','pending','approved')`,
    ),
    index("order_customer").on(t.customerId),
    index("order_status_idx").on(t.status),
  ],
);
export const items = sqliteTable(
  "items",
  {
    id: id(),
    baleId: text("bale_id")
      .notNull()
      .references(() => bales.id),
    category: text("category")
      .notNull()
      .references(() => categories.id),
    condition: text("condition").notNull(),
    grade: text("grade").references(() => grades.id),
    price: integer("price"),
    status: text("status").notNull(),
    locationId: text("location_id").references(() => locations.id),
    availableAt: text("available_at"),
    soldAt: text("sold_at"),
    outboundAt: text("outbound_at"),
    sortedAt: text("sorted_at").notNull(),
    sortedBy: text("sorted_by").notNull(),
    laundryAt: text("laundry_at"),
    orderId: text("order_id").references(() => orders.id),
  },
  (t) => [
    check(
      "item_status",
      sql`${t.status} in ('laundry','available','reserved','sold','outbound','returned','written-off')`,
    ),
    check("item_price", sql`${t.price} is null or ${t.price} > 0`),
    index("item_sold").on(t.soldAt),
    index("item_outbound").on(t.outboundAt),
    index("item_status_idx").on(t.status),
    index("item_location").on(t.locationId),
  ],
);
export const liveItems = sqliteTable(
  "live_items",
  {
    liveId: text("live_id")
      .notNull()
      .references(() => lives.id),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id),
  },
  (t) => [primaryKey({ columns: [t.liveId, t.itemId] })],
);
export const orderLines = sqliteTable(
  "order_lines",
  {
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    itemId: text("item_id")
      .notNull()
      .unique()
      .references(() => items.id),
    category: text("category")
      .notNull()
      .references(() => categories.id),
    grade: text("grade")
      .notNull()
      .references(() => grades.id),
    price: money("price"),
    position: integer("position").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.orderId, t.itemId] }),
    check("line_price", sql`${t.price} > 0`),
  ],
);
export const returns = sqliteTable("supplier_returns", {
  id: id(),
  baleId: text("bale_id")
    .notNull()
    .references(() => bales.id),
  category: text("category")
    .notNull()
    .references(() => categories.id),
  condition: text("condition").notNull(),
  reason: text("reason").notNull(),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by").notNull(),
});
export const movements = sqliteTable(
  "movements",
  {
    id: id(),
    entityId: text("entity_id").notNull(),
    occurredAt: text("occurred_at").notNull(),
    action: text("action").notNull(),
    from: text("from_state").notNull(),
    to: text("to_state").notNull(),
    actor: text("actor").notNull(),
  },
  (t) => [index("movement_entity_date").on(t.entityId, t.occurredAt)],
);
export const inventoryHistory = sqliteTable(
  "inventory_history",
  {
    id: id(),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id),
    occurredAt: text("occurred_at").notNull(),
    status: text("status").notNull(),
    grade: text("grade"),
    price: integer("price"),
    locationId: text("location_id"),
    actorId: text("actor_id").references(() => users.id),
  },
  (t) => [index("history_item_date").on(t.itemId, t.occurredAt)],
);
export const priceRules = sqliteTable(
  "price_rules",
  {
    category: text("category")
      .notNull()
      .references(() => categories.id),
    grade: text("grade")
      .notNull()
      .references(() => grades.id),
    price: money("price"),
  },
  (t) => [
    primaryKey({ columns: [t.category, t.grade] }),
    check("rule_positive", sql`${t.price} > 0`),
  ],
);
export const settings = sqliteTable("settings", {
  id: id(),
  value: text("value", { mode: "json" }).$type<unknown>().notNull(),
});
export const deposits = sqliteTable(
  "deposit_ledger",
  {
    id: id(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    occurredAt: text("occurred_at").notNull(),
    description: text("description").notNull(),
    amount: money("amount"),
  },
  (t) => [index("deposit_customer").on(t.customerId)],
);
export const invoices = sqliteTable("invoices", {
  id: id(),
  orderId: text("order_id")
    .notNull()
    .unique()
    .references(() => orders.id),
  createdAt: text("created_at").notNull(),
});
export const invoiceEvents = sqliteTable("invoice_events", {
  id: id(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  occurredAt: text("occurred_at").notNull(),
  actor: text("actor").notNull(),
});
export const payments = sqliteTable(
  "payment_attempts",
  {
    id: id(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    method: text("method").notNull(),
    amount: money("amount"),
    submittedAt: text("submitted_at").notNull(),
    status: text("status").notNull(),
    proof: text("proof", { mode: "json" }).$type<{
      fileName: string;
      amount: number;
      uploadId?: string;
    } | null>(),
    reviewedAt: text("reviewed_at"),
    reviewedBy: text("reviewed_by"),
    rejectionReason: text("rejection_reason"),
    balanceBefore: integer("balance_before"),
    balanceAfter: integer("balance_after"),
  },
  (t) => [
    uniqueIndex("one_approved_payment")
      .on(t.orderId)
      .where(sql`${t.status} = 'approved'`),
    check("payment_amount", sql`${t.amount} >= 0`),
    check("payment_method", sql`${t.method} in ('transfer','deposit')`),
    check(
      "payment_status",
      sql`${t.status} in ('pending','approved','rejected')`,
    ),
  ],
);
export const packing = sqliteTable("packing", {
  orderId: text("order_id")
    .primaryKey()
    .references(() => orders.id),
  codeMatches: integer("code_matches", { mode: "boolean" }).notNull(),
  conditionMatches: integer("condition_matches", { mode: "boolean" }).notNull(),
  packed: integer("packed", { mode: "boolean" }).notNull(),
  packedAt: text("packed_at"),
  packedBy: text("packed_by"),
});
export const pickedItems = sqliteTable(
  "picked_items",
  {
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id),
  },
  (t) => [primaryKey({ columns: [t.orderId, t.itemId] })],
);
export const shipments = sqliteTable(
  "shipments",
  {
    id: id(),
    orderId: text("order_id")
      .notNull()
      .unique()
      .references(() => orders.id),
    courier: text("courier").notNull(),
    trackingNumber: text("tracking_number").notNull(),
    handedOverAt: text("handed_over_at").notNull(),
    status: text("status").notNull(),
  },
  (t) => [
    uniqueIndex("courier_tracking_unique").on(t.courier, t.trackingNumber),
  ],
);
export const shipmentEvents = sqliteTable("shipment_events", {
  id: id(),
  shipmentId: text("shipment_id")
    .notNull()
    .references(() => shipments.id),
  title: text("title").notNull(),
  dateTime: text("date_time").notNull(),
  description: text("description").notNull(),
});
export const strategies = sqliteTable("strategies", {
  id: id(),
  month: text("month").notNull().unique(),
  content: text("content").notNull(),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  authorName: text("author_name").notNull(),
  createdAt: text("created_at").notNull(),
  sentAt: text("sent_at"),
});
export const strategyRecipients = sqliteTable(
  "strategy_recipients",
  {
    strategyId: text("strategy_id")
      .notNull()
      .references(() => strategies.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
  },
  (t) => [primaryKey({ columns: [t.strategyId, t.userId] })],
);
export const drafts = sqliteTable("live_drafts", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  data: text("data", { mode: "json" })
    .$type<import("../features/penjualan/model").LiveDraft>()
    .notNull(),
});
export const claimBatches = sqliteTable(
  "claim_batches",
  {
    id: id(),
    liveId: text("live_id")
      .notNull()
      .references(() => lives.id),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id),
    source: text("source").notNull(),
    sourceHash: text("source_hash").notNull(),
    createdAt: text("created_at").notNull(),
    status: text("status").notNull(),
    rawText: text("raw_text").notNull(),
    extraction: text("extraction", { mode: "json" }).$type<unknown>(),
  },
  (t) => [index("batch_live").on(t.liveId)],
);
export const claims = sqliteTable(
  "claims",
  {
    id: id(),
    batchId: text("batch_id")
      .notNull()
      .references(() => claimBatches.id),
    liveId: text("live_id")
      .notNull()
      .references(() => lives.id),
    line: integer("line").notNull(),
    handle: text("handle").notNull(),
    itemCode: text("item_code").notNull(),
    time: text("time").notNull(),
    milliseconds: integer("milliseconds"),
    error: text("error"),
    outcome: text("outcome").notNull(),
    reason: text("reason").notNull(),
    orderId: text("order_id").references(() => orders.id),
  },
  (t) => [
    uniqueIndex("one_winner_per_item")
      .on(t.itemCode)
      .where(sql`${t.outcome} = 'won'`),
    uniqueIndex("live_claim_line").on(t.liveId, t.line),
  ],
);
export const requests = sqliteTable("operation_requests", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  domain: text("domain").notNull(),
  bodyHash: text("body_hash").notNull(),
  entityId: text("entity_id").notNull(),
  createdAt: text("created_at").notNull(),
});
export const audit = sqliteTable("audit_log", {
  id: id(),
  actorId: text("actor_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  entityId: text("entity_id").notNull(),
  occurredAt: text("occurred_at").notNull(),
});
export const uploads = sqliteTable("uploads", {
  id: id(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  originalName: text("original_name").notNull(),
  mime: text("mime").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  createdAt: text("created_at").notNull(),
});
