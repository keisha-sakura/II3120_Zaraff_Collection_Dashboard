"use client";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Workspace } from "@/types/workspace";
import type { WarehouseCommand } from "@/features/gudang/model";
import type { SalesCommand } from "@/features/penjualan/model";
import type { PaymentCommand } from "@/features/pembayaran/model";
import type { ShippingCommand } from "@/features/pengiriman/model";
import type { ReportsCommand } from "@/features/laporan/model";
import type { SettingsCommand } from "@/features/pengaturan/model";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Snapshot = {
  data: Workspace;
  pending: boolean;
  storageUnavailable: false;
};
let snapshot: Snapshot | null = null;
let status: { error: string | null } = { error: null };
let loading = false;
let generation = 0;
let mutationRevision = 0;
let pending = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const inFlight = new Map<string, Promise<string>>();
const retryKeys = new Map<string, string>();
let queue: Promise<unknown> = Promise.resolve();
let stopListening: (() => void) | null = null;
export function clearWorkspace() {
  generation++;
  snapshot = null;
  status = { error: null };
  loading = false;
  inFlight.clear();
  retryKeys.clear();
  pending = 0;
  emit();
}
export async function refreshWorkspace() {
  if (loading || pending) return;
  const epoch = generation;
  const revision = mutationRevision;
  loading = true;
  try {
    const response = await fetch("/api/workspace", { cache: "no-store" });
    if (epoch !== generation) return;
    if (response.status === 401) {
      clearWorkspace();
      window.dispatchEvent(new Event("zaraff:unauthorized"));
      return;
    }
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error ?? "Data tidak dapat dimuat.");
    if (epoch === generation && revision === mutationRevision && !pending) {
      snapshot = {
        data: result.state,
        pending: false,
        storageUnavailable: false,
      };
      status = { error: null };
    }
  } catch (error) {
    if (epoch === generation && revision === mutationRevision)
      status = {
        error:
          error instanceof Error ? error.message : "Koneksi server bermasalah.",
      };
  } finally {
    if (epoch === generation) {
      loading = false;
      emit();
    }
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!snapshot && !loading) void refreshWorkspace();
  if (!stopListening) {
    const focus = () => {
      void refreshWorkspace();
    };
    window.addEventListener("focus", focus);
    const interval = window.setInterval(focus, 15000);
    stopListening = () => {
      window.removeEventListener("focus", focus);
      window.clearInterval(interval);
      stopListening = null;
    };
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) stopListening?.();
  };
}
export function useWorkspace() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => null,
  );
}
export function WorkspaceGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const leave = () => {
      router.replace("/masuk");
      router.refresh();
    };
    window.addEventListener("zaraff:unauthorized", leave);
    return () => window.removeEventListener("zaraff:unauthorized", leave);
  }, [router]);
  const data = useWorkspace();
  const state = useSyncExternalStore(
    subscribe,
    () => status,
    () => status,
  );
  if (state.error)
    return (
      <Alert tone="danger" title="Data belum dapat dimuat">
        <p>{state.error}</p>
        <Button className="mt-3" onClick={() => void refreshWorkspace()}>
          Coba lagi
        </Button>
      </Alert>
    );
  if (!data)
    return (
      <p role="status" className="text-muted py-8">
        Memuat data…
      </p>
    );
  return (
    <fieldset
      disabled={data.pending}
      aria-busy={data.pending}
      className="min-w-0"
    >
      {children}
    </fieldset>
  );
}
export function executeCommand(
  domain: string,
  command: unknown,
): Promise<string> {
  const fingerprint = JSON.stringify([domain, command]);
  const current = inFlight.get(fingerprint);
  if (current) return current;
  const epoch = generation;
  const key = retryKeys.get(fingerprint) ?? crypto.randomUUID();
  retryKeys.set(fingerprint, key);
  mutationRevision++;
  pending++;
  if (snapshot) snapshot = { ...snapshot, pending: true };
  emit();
  const task = queue
    .then(async () => {
      if (epoch !== generation) throw new Error("Sesi pengguna sudah berubah.");
      const response = await fetch(`/api/operations/${domain}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Zaraff-Request": "1",
          "Idempotency-Key": key,
        },
        body: JSON.stringify(command),
      });
      const result = await response.json();
      if (epoch !== generation) throw new Error("Sesi pengguna sudah berubah.");
      if (!response.ok) {
        if (response.status < 500) retryKeys.delete(fingerprint);
        if (response.status === 401) {
          clearWorkspace();
          window.dispatchEvent(new Event("zaraff:unauthorized"));
        }
        throw new Error(result.error ?? "Perubahan belum dapat disimpan.");
      }
      retryKeys.delete(fingerprint);
      if (epoch === generation) {
        snapshot = {
          data: result.state,
          pending: true,
          storageUnavailable: false,
        };
        status = { error: null };
        emit();
      }
      return result.entityId as string;
    })
    .finally(() => {
      if (epoch === generation) {
        pending--;
        inFlight.delete(fingerprint);
        if (snapshot) snapshot = { ...snapshot, pending: pending > 0 };
        emit();
      }
    });
  queue = task.catch(() => {});
  inFlight.set(fingerprint, task);
  return task;
}
export const executeWarehouseCommand = (command: WarehouseCommand) =>
  executeCommand("warehouse", command);
export const executeSalesCommand = (command: SalesCommand) =>
  executeCommand("sales", command);
export const executePaymentCommand = (command: PaymentCommand) =>
  executeCommand("payments", command);
export const executeShippingCommand = (command: ShippingCommand) =>
  executeCommand("shipping", command);
export const executeReportsCommand = (command: ReportsCommand) =>
  executeCommand("reports", command);
export const executeSettingsCommand = (command: SettingsCommand) =>
  executeCommand("settings", command);
