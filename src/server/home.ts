import type {
  HomeDashboardData,
  OwnerNote,
} from "../features/beranda/contracts";
import type { User } from "../types/domain";
import { progressPercentage } from "../features/beranda/contracts.ts";
import { monthOf, reportData } from "../features/laporan/selectors.ts";
import { database, type DatabaseContext } from "./db.ts";
import { loadWorkspace } from "./workspace.ts";
import { settings } from "./schema.ts";
export function homeDashboard(
  user: User,
  now = new Date().toISOString(),
  ctx: DatabaseContext = database(),
): HomeDashboardData {
  return ctx.sqlite.transaction(() => dashboardData(user, now, ctx)).deferred();
}
function dashboardData(
  user: User,
  now: string,
  ctx: DatabaseContext,
): HomeDashboardData {
  const state = loadWorkspace(ctx, user.id);
  const month = monthOf(now);
  const report = reportData(state.warehouse, state.sales, month);
  const orders = state.sales.orders.filter(
    (order) => monthOf(order.createdAt) === month,
  );
  const live = state.sales.lives.filter(
    (live) => monthOf(live.scheduledAt) === month,
  );
  const monthName = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    timeZone: "Asia/Jakarta",
  }).format(new Date(now));
  const next = new Date(`${month}-01T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const previous = new Date(`${month}-01T00:00:00Z`);
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  const strategy = state.reports.strategies
    .filter(
      (strategy) => strategy.sentAt && strategy.recipientIds.includes(user.id),
    )
    .sort((a, b) => b.month.localeCompare(a.month))[0];
  const note: OwnerNote = {
    publishedAt: strategy?.sentAt ?? now,
    title: strategy ? `Strategi ${strategy.month}` : "Catatan Owner",
    lines: strategy
      ? strategy.content.split(/\n+/).filter(Boolean)
      : ["Belum ada strategi yang dibagikan kepadamu."],
  };
  if (user.role === "owner") {
    const targets = ctx.orm.select().from(settings).all();
    const saleTarget = Number(
      targets.find((row) => row.id === "monthly-sale-target")?.value ?? 0,
    );
    const incomeTarget = Number(
      targets.find((row) => row.id === "monthly-revenue-target")?.value ?? 0,
    );
    return {
      role: "owner",
      monthLabel: monthName,
      soldItems: report.sold.length,
      salesProgress: progressPercentage(report.sold.length, saleTarget),
      income: report.revenue,
      incomeProgress: progressPercentage(report.revenue, incomeTarget),
      orders: {
        completed: orders.filter((row) => row.status === "completed").length,
        shipped: orders.filter((row) => row.status === "shipped").length,
        packed: orders.filter((row) => row.status === "packed").length,
        paid: orders.filter((row) => row.status === "paid").length,
        awaitingPayment: orders.filter(
          (row) => row.status === "awaiting-payment",
        ).length,
      },
      nextStrategyMonth: new Intl.DateTimeFormat("id-ID", {
        month: "long",
      }).format(next),
      previousReportMonth: previous.toISOString().slice(0, 7),
      previousReportLabel: new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(previous),
    };
  }
  if (user.role === "admin")
    return {
      role: "admin",
      liveLabel: "bulan ini",
      payments: {
        paid: state.sales.orders.filter(
          (row) => row.paymentStatus === "approved",
        ).length,
        pending: state.sales.orders.filter(
          (row) => row.paymentStatus === "pending",
        ).length,
        unpaid: state.sales.orders.filter(
          (row) => row.paymentStatus === "unpaid",
        ).length,
      },
      shipping: {
        delivered: state.sales.orders.filter(
          (row) => row.status === "completed",
        ).length,
        inTransit: state.sales.orders.filter((row) => row.status === "shipped")
          .length,
        awaitingDispatch: state.sales.orders.filter(
          (row) => row.status === "paid" || row.status === "packed",
        ).length,
      },
      live: {
        completed: live.filter((row) => row.status === "completed").length,
        scheduled: live.filter((row) => row.status !== "draft").length,
      },
      readyToShip: state.sales.orders.filter((row) => row.status === "packed")
        .length,
      draftPromotion:
        state.sales.lives.find((row) => row.status === "draft")?.title ??
        "Belum ada draf promosi",
    };
  if (user.role === "live-host") {
    const assigned = state.sales.lives.filter((row) => row.hostId === user.id);
    return {
      role: "live-host",
      completedLives: assigned.filter(
        (row) =>
          row.status === "completed" && monthOf(row.scheduledAt) === month,
      ).length,
      scheduledLives: assigned.filter(
        (row) => row.status !== "draft" && monthOf(row.scheduledAt) === month,
      ).length,
      upcoming: assigned
        .filter(
          (row) =>
            row.status === "published" &&
            Date.parse(row.scheduledAt) >= Date.parse(now),
        )
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
      note,
    };
  }
  if (user.role === "packing") {
    const active = state.sales.orders.filter(
      (row) => row.status === "paid" || row.status === "packed",
    );
    return {
      role: "packing",
      packedOrders: active.filter((row) => row.status === "packed").length,
      paidOrders: active.length,
      pickedItems: state.shipping.packing
        .filter((record) => active.some((order) => order.id === record.orderId))
        .reduce(
          (sum, record) => sum + record.checklist.pickedItemIds.length,
          0,
        ),
      totalItems: active.reduce((sum, order) => sum + order.itemIds.length, 0),
      note,
    };
  }
  const bale =
    state.warehouse.bales.find((row) => row.status === "sorting") ??
    state.warehouse.bales.find((row) => row.status === "stored");
  const items = state.warehouse.items.filter((row) => row.baleId === bale?.id);
  return {
    role: "penyortir",
    baleId: bale?.id ?? "",
    baleCategory: bale?.category ?? "Belum ada bale aktif",
    sortedItems:
      items.length +
      state.warehouse.returns.filter((row) => row.baleId === bale?.id).length,
    totalItems: bale?.estimatedItems ?? 0,
    launderedItems: items.filter((row) => row.availableAt).length,
    note,
  };
}
