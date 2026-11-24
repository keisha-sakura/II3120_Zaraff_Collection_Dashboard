"use client";
import {
  useDemoWorkspace,
  executeDemoWarehouseCommand,
  operationsStorageKey,
} from "@/mocks/store/operations-store";
export const warehouseStorageKey = operationsStorageKey;
export const executeWarehouseCommand = executeDemoWarehouseCommand;
export function useWarehouseSnapshot() {
  const snapshot = useDemoWorkspace();
  return snapshot
    ? {
        data: snapshot.data.warehouse,
        priceRules: snapshot.data.settings.priceRules,
        storageUnavailable: snapshot.storageUnavailable,
      }
    : null;
}
