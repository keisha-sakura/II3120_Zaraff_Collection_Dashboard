"use client";
import { useSyncExternalStore } from "react";
import { createWarehouseDemo } from "@/mocks/data/warehouse-demo";
import { createSalesDemo } from "@/mocks/data/sales-demo";
import { isWarehouseState } from "@/features/gudang/persistence";
import { isSalesState } from "@/features/penjualan/persistence";
import { applyWarehouseCommand } from "@/features/gudang/operations";
import { applySalesCommand } from "@/features/penjualan/operations";
import type { WarehouseState, WarehouseCommand } from "@/features/gudang/model";
import type { SalesState, SalesCommand } from "@/features/penjualan/model";

export const operationsStorageKey = "zaraff.operations.demo.v1";
export const legacyWarehouseStorageKey = "zaraff.warehouse.demo.v1";
type Workspace = { version: 1; warehouse: WarehouseState; sales: SalesState };
type Snapshot = { data: Workspace; storageUnavailable: boolean };
let snapshot: Snapshot | null = null;
let attached = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
function initial(warehouse = createWarehouseDemo()): Workspace {
  return { version: 1, ...createSalesDemo(warehouse) };
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
      snapshot = { data: value as Workspace, storageUnavailable: false };
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
  commit({ version: 1, sales: result.sales, warehouse: result.warehouse });
  return result.entityId;
}
