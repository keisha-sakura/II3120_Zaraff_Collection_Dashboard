import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { User } from "../types/domain";
import type { Workspace } from "../types/workspace";
import { database, type DatabaseContext } from "./db.ts";
import { HttpError } from "./auth-core.ts";
import { canAccessPage, type PageId } from "../config/pages.ts";
import {
  loadWorkspace,
  saveWorkspace,
  recordInventoryHistory,
  digest,
} from "./workspace.ts";
import { applyWarehouseCommand } from "../features/gudang/operations.ts";
import { applySalesCommand } from "../features/penjualan/operations.ts";
import { applyPaymentCommand } from "../features/pembayaran/operations.ts";
import { applyShippingCommand } from "../features/pengiriman/operations.ts";
import { applyReportsCommand } from "../features/laporan/operations.ts";
import { applySettingsCommand } from "../features/pengaturan/operations.ts";
import { ensureInvoices } from "../features/pembayaran/invoices.ts";
import type { SettingsCommand } from "../features/pengaturan/model";
import * as validation from "./validation.ts";
import * as t from "./schema.ts";

export const domainPages: Record<string, PageId> = {
  warehouse: "G01",
  sales: "P02",
  payments: "Y01",
  shipping: "D02",
  reports: "R05",
  settings: "S01",
  deposit: "P10",
};
export function executeOperation(
  domain: string,
  body: unknown,
  user: User,
  key: string,
  ctx: DatabaseContext = database(),
  now = new Date().toISOString(),
) {
  if (!domainPages[domain] || !canAccessPage(user.role, domainPages[domain]))
    throw new HttpError(
      403,
      "Peran ini tidak memiliki akses untuk aksi tersebut.",
    );
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(key))
    throw new HttpError(400, "Idempotency key wajib diisi.");
  const requestId = `${user.id}:${key}`;
  const bodyHash = digest(`${domain}:${JSON.stringify(body)}`);
  return ctx.sqlite
    .transaction(() => {
      const previous = ctx.orm
        .select()
        .from(t.requests)
        .where(eq(t.requests.id, requestId))
        .get();
      if (previous) {
        if (previous.bodyHash !== bodyHash || previous.domain !== domain)
          throw new HttpError(
            409,
            "Kunci permintaan sudah dipakai untuk data lain.",
          );
        return {
          entityId: previous.entityId,
          state: loadWorkspace(ctx, user.id),
          replayed: true,
        };
      }
      const before = loadWorkspace(ctx, user.id);
      const state: Workspace = structuredClone(before);
      let entityId = "";
      try {
        if (domain === "warehouse") {
          const command = validation.warehouseCommand.parse(body);
          const result = applyWarehouseCommand(
            state.warehouse,
            command,
            user.name,
            now,
          );
          state.warehouse = result.state;
          entityId = result.entityId;
        } else if (domain === "sales") {
          const command = validation.salesCommand.parse(body);
          if (command.type === "complete-live") {
            const live = state.sales.lives.find(
              (live) => live.id === command.liveId,
            );
            if (!live || live.status !== "published")
              throw new HttpError(
                409,
                "Hanya live dipublikasikan yang dapat diselesaikan.",
              );
            live.status = "completed";
            entityId = live.id;
          } else {
            if (command.type === "save-content") {
              const host = ctx.orm
                .select()
                .from(t.users)
                .where(eq(t.users.id, command.input.hostId))
                .get();
              if (!host?.active || host.role !== "live-host")
                throw new HttpError(400, "Pilih Live Host aktif.");
            }
            const result = applySalesCommand(
              state.sales,
              state.warehouse,
              command,
              user.name,
              now,
              state.directory?.filter((row) => row.role === "live-host") ?? [],
            );
            state.sales = result.sales;
            state.warehouse = result.warehouse;
            entityId = result.entityId;
            if (command.type === "process-claims") {
              const sourceHash = digest(command.text);
              ctx.orm
                .insert(t.claimBatches)
                .values({
                  id: randomUUID(),
                  liveId: command.liveId,
                  actorId: user.id,
                  source: "text-csv-manual",
                  sourceHash,
                  rawText: command.text,
                  createdAt: now,
                  status: "processed",
                })
                .run();
            }
          }
          state.payments = ensureInvoices(state.payments, state.sales);
        } else if (domain === "payments") {
          const command = validation.paymentCommand.parse(body);
          if (command.type === "submit") {
            const order = state.sales.orders.find(
              (order) => order.id === command.orderId,
            );
            if (
              !order ||
              order.status !== "awaiting-payment" ||
              order.paymentStatus !== "unpaid"
            )
              throw new HttpError(
                409,
                "Tagihan ini tidak dapat diajukan ulang.",
              );
            const proof = command.proofId
              ? ctx.orm
                  .select()
                  .from(t.uploads)
                  .where(eq(t.uploads.id, command.proofId))
                  .get()
              : undefined;
            if (
              command.method === "transfer" &&
              (!proof || proof.ownerId !== user.id)
            )
              throw new HttpError(400, "Unggah bukti transfer yang valid.");
            const id = `payment-${randomUUID()}`;
            state.payments.attempts.push({
              id,
              orderId: order.id,
              method: command.method,
              amount: command.amount,
              submittedAt: now,
              status: "pending",
              proof: proof
                ? {
                    fileName: proof.originalName,
                    amount: command.amount,
                    uploadId: proof.id,
                  }
                : null,
              reviewedAt: null,
              reviewedBy: null,
              rejectionReason: null,
              balanceBefore: null,
              balanceAfter: null,
            });
            order.paymentStatus = "pending";
            entityId = id;
          } else {
            const result = applyPaymentCommand(
              state.payments,
              state.sales,
              state.warehouse,
              command,
              user.name,
              now,
            );
            state.payments = result.payments;
            state.sales = result.sales;
            state.warehouse = result.warehouse;
            entityId = result.entityId;
          }
        } else if (domain === "shipping") {
          const command = validation.shippingCommand.parse(body);
          const result = applyShippingCommand(
            state.shipping,
            state.sales,
            state.warehouse,
            command,
            user,
            now,
          );
          state.shipping = result.shipping;
          state.sales = result.sales;
          state.warehouse = result.warehouse;
          entityId = result.entityId;
        } else if (domain === "reports") {
          const result = applyReportsCommand(
            state.reports,
            validation.reportsCommand.parse(body),
            user,
            now,
            state.directory?.filter((row) => row.role !== "owner") ?? [],
          );
          state.reports = result.state;
          entityId = result.entityId;
        } else if (domain === "settings") {
          const result = applySettingsCommand(
            state.settings,
            state.sales,
            state.warehouse,
            validation.settingsCommand.parse(body) as SettingsCommand,
            user,
          );
          state.settings = result.settings;
          state.sales = result.sales;
          state.warehouse = result.warehouse;
          entityId = result.entityId;
        } else if (domain === "deposit") {
          const command = validation.depositCommand.parse(body);
          const customer = state.sales.customers.find(
            (row) => row.id === command.customerId,
          );
          if (!customer) throw new HttpError(404, "Pelanggan tidak ditemukan.");
          customer.depositBalance += command.amount;
          entityId = `deposit-${randomUUID()}`;
          state.sales.deposits.unshift({
            id: entityId,
            customerId: customer.id,
            amount: command.amount,
            description: command.description,
            occurredAt: now,
          });
        }
      } catch (error) {
        if (
          error instanceof HttpError ||
          (error instanceof Error && error.name === "ZodError")
        )
          throw error;
        throw new HttpError(
          409,
          error instanceof Error
            ? error.message
            : "Data sudah berubah. Muat ulang halaman.",
        );
      }
      saveWorkspace(ctx, state, user.id);
      recordInventoryHistory(ctx, before, state, user.id, now);
      ctx.orm
        .insert(t.audit)
        .values({
          id: randomUUID(),
          actorId: user.id,
          action: `${domain}:${(body as { type: string }).type}`,
          entityId,
          occurredAt: now,
        })
        .run();
      ctx.orm
        .insert(t.requests)
        .values({
          id: requestId,
          userId: user.id,
          domain,
          bodyHash,
          entityId,
          createdAt: now,
        })
        .run();
      return { entityId, state: loadWorkspace(ctx, user.id), replayed: false };
    })
    .immediate();
}
