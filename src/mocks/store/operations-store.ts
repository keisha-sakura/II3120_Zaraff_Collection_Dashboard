"use client";
import { useSyncExternalStore } from "react";
import { createReportsDemo } from "@/mocks/data/reports-demo";
import { isReportsState } from "@/features/laporan/persistence";
import { applyReportsCommand } from "@/features/laporan/operations";
import type { ReportsState, ReportsCommand } from "@/features/laporan/model";
import { createWarehouseDemo } from "@/mocks/data/warehouse-demo";
import { createSalesDemo } from "@/mocks/data/sales-demo";
import { createPaymentsDemo, ensureInvoices } from "@/mocks/data/payments-demo";
import { isPaymentsState } from "@/features/pembayaran/persistence";
import { applyPaymentCommand } from "@/features/pembayaran/operations";
import {
  createShippingDemo,
  ensureShippingRecords,
} from "@/mocks/data/shipping-demo";
import { isShippingState } from "@/features/pengiriman/persistence";
import { applyShippingCommand } from "@/features/pengiriman/operations";
import type {
  ShippingState,
  ShippingCommand,
} from "@/features/pengiriman/model";
import type { User } from "@/types/domain";
import type {
  PaymentsState,
  PaymentCommand,
} from "@/features/pembayaran/model";
import { isWarehouseState } from "@/features/gudang/persistence";
import { isSalesState } from "@/features/penjualan/persistence";
import { applyWarehouseCommand } from "@/features/gudang/operations";
import { applySalesCommand } from "@/features/penjualan/operations";
import type { WarehouseState, WarehouseCommand } from "@/features/gudang/model";
import type { SalesState, SalesCommand } from "@/features/penjualan/model";

export const operationsStorageKey = "zaraff.operations.demo.v1";
export const legacyWarehouseStorageKey = "zaraff.warehouse.demo.v1";
type Workspace = {
  version: 1;
  warehouse: WarehouseState;
  sales: SalesState;
  payments: PaymentsState;
  shipping: ShippingState;
  reports: ReportsState;
};
type Snapshot = { data: Workspace; storageUnavailable: boolean };
let snapshot: Snapshot | null = null;
let attached = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
function initial(warehouse?: WarehouseState): Workspace {
  const seed = createSalesDemo(warehouse ?? createWarehouseDemo());
  const prepared = createPaymentsDemo(
    seed.sales,
    seed.warehouse,
    warehouse === undefined,
  );
  return {
    version: 1,
    ...prepared,
    shipping: createShippingDemo(prepared.sales),
    reports: createReportsDemo(),
  };
}
function restore() {
  try {
    const text = localStorage.getItem(operationsStorageKey);
    const value: unknown = text ? JSON.parse(text) : null;
    if (
      typeof value === "object" &&
      value !== null &&
      "version" in value &&
      value.version === 1 &&
      "warehouse" in value &&
      isWarehouseState(value.warehouse) &&
      "sales" in value &&
      isSalesState(value.sales)
    ) {
      const payments =
        "payments" in value && isPaymentsState(value.payments)
          ? ensureInvoices(value.payments, value.sales)
          : createPaymentsDemo(value.sales, value.warehouse).payments;
      snapshot = {
        data: {
          version: 1,
          warehouse: value.warehouse,
          sales: value.sales,
          payments,
          reports:
            "reports" in value && isReportsState(value.reports)
              ? value.reports
              : createReportsDemo(),
          shipping:
            "shipping" in value && isShippingState(value.shipping)
              ? ensureShippingRecords(value.shipping, value.sales)
              : createShippingDemo(value.sales),
        },
        storageUnavailable: false,
      };
      return;
    }
    const legacyText = localStorage.getItem(legacyWarehouseStorageKey);
    let legacy: unknown = null;
    try {
      legacy = legacyText ? JSON.parse(legacyText) : null;
    } catch {
      /* Restore the fixture if the old demo is malformed. */
    }
    snapshot = {
      data: initial(isWarehouseState(legacy) ? legacy : undefined),
      storageUnavailable: false,
    };
  } catch {
    snapshot = { data: snapshot?.data ?? initial(), storageUnavailable: true };
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!snapshot) restore();
  if (!attached) {
    window.addEventListener("storage", (event) => {
      if (event.key === operationsStorageKey || event.key === null) {
        restore();
        emit();
      }
    });
    attached = true;
  }
  return () => {
    listeners.delete(listener);
  };
}
export function useDemoWorkspace() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => null,
  );
}
function commit(data: Workspace) {
  snapshot = { data, storageUnavailable: false };
  try {
    localStorage.setItem(operationsStorageKey, JSON.stringify(data));
  } catch {
    snapshot.storageUnavailable = true;
  }
  emit();
}
export function executeDemoWarehouseCommand(
  command: WarehouseCommand,
  actor: string,
) {
  if (!snapshot) throw new Error("Data sedang dimuat.");
  const result = applyWarehouseCommand(
    snapshot.data.warehouse,
    command,
    actor,
    new Date().toISOString(),
  );
  commit({ ...snapshot.data, warehouse: result.state });
  return result.entityId;
}
export function executeDemoSalesCommand(command: SalesCommand, actor: string) {
  if (!snapshot) throw new Error("Data sedang dimuat.");
  const result = applySalesCommand(
    snapshot.data.sales,
    snapshot.data.warehouse,
    command,
    actor,
    new Date().toISOString(),
  );
  // One storage write keeps orders, claims and reserved warehouse items together.
  commit({
    ...snapshot.data,
    sales: result.sales,
    warehouse: result.warehouse,
    payments: ensureInvoices(snapshot.data.payments, result.sales),
  });
  return result.entityId;
}

export function executeDemoPaymentCommand(
  command: PaymentCommand,
  actor: string,
) {
  if (!snapshot) throw new Error("Data sedang dimuat.");
  const result = applyPaymentCommand(
    snapshot.data.payments,
    snapshot.data.sales,
    snapshot.data.warehouse,
    command,
    actor,
    new Date().toISOString(),
  );
  commit({
    ...snapshot.data,
    sales: result.sales,
    warehouse: result.warehouse,
    payments: result.payments,
  });
  return result.entityId;
}

export function executeDemoShippingCommand(
  command: ShippingCommand,
  actor: Pick<User, "name" | "role">,
) {
  if (!snapshot) throw new Error("Data sedang dimuat.");
  const result = applyShippingCommand(
    snapshot.data.shipping,
    snapshot.data.sales,
    snapshot.data.warehouse,
    command,
    actor,
    new Date().toISOString(),
  );
  commit({
    ...snapshot.data,
    shipping: result.shipping,
    sales: result.sales,
    warehouse: result.warehouse,
  });
  return result.entityId;
}

export function executeDemoReportsCommand(
  command: ReportsCommand,
  actor: User,
) {
  if (!snapshot) throw new Error("Data sedang dimuat.");
  const result = applyReportsCommand(
    snapshot.data.reports,
    command,
    actor,
    new Date().toISOString(),
  );
  commit({ ...snapshot.data, reports: result.state });
  return result.entityId;
}
