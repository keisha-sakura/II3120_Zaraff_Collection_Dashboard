"use client";
import { useSyncExternalStore } from "react";
import { createWarehouseDemo } from "@/mocks/data/warehouse-demo";
import { applyWarehouseCommand } from "./operations";
import { isWarehouseState } from "./persistence";
import type { WarehouseCommand, WarehouseState } from "./model";

export const warehouseStorageKey = "zaraff.warehouse.demo.v1";
type Snapshot = { data: WarehouseState; storageUnavailable: boolean };
let snapshot: Snapshot | null = null;
let storageListenerAttached = false;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((listener) => listener());
}
function restore() {
  try {
    const stored = localStorage.getItem(warehouseStorageKey);
    const parsed: unknown = stored ? JSON.parse(stored) : null;
    snapshot = {
      data: isWarehouseState(parsed) ? parsed : createWarehouseDemo(),
      storageUnavailable: false,
    };
  } catch {
    snapshot = {
      data: snapshot?.data ?? createWarehouseDemo(),
      storageUnavailable: true,
    };
  }
}
function onStorage(event: StorageEvent) {
  if (event.key === warehouseStorageKey || event.key === null) {
    restore();
    emit();
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!snapshot) restore();
  if (!storageListenerAttached) {
    window.addEventListener("storage", onStorage);
    storageListenerAttached = true;
  }
  return () => {
    listeners.delete(listener);
  };
}
export function useWarehouseSnapshot() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => null,
  );
}
export function executeWarehouseCommand(
  command: WarehouseCommand,
  actor: string,
) {
  if (!snapshot) throw new Error("Data gudang sedang dimuat.");
  const result = applyWarehouseCommand(
    snapshot.data,
    command,
    actor,
    new Date().toISOString(),
  );
  snapshot = { data: result.state, storageUnavailable: false };
  try {
    localStorage.setItem(warehouseStorageKey, JSON.stringify(result.state));
  } catch {
    snapshot.storageUnavailable = true;
  }
  emit();
  return result.entityId;
}
