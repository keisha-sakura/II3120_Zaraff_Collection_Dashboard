"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useWorkspace, executeSettingsCommand } from "@/lib/workspace-store";
import { Alert } from "@/components/ui/alert";
import type { User } from "@/types/domain";
import type { SalesState } from "@/features/penjualan/model";
import type { WarehouseState } from "@/features/gudang/model";
import type { SettingsState, SettingsCommand } from "../model";
type Value = {
  state: SettingsState;
  sales: SalesState;
  warehouse: WarehouseState;
  run: (command: SettingsCommand) => Promise<string | null>;
  user: User;
  error: string | null;
};
const Context = createContext<Value | null>(null);
export function SettingsProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  const snapshot = useWorkspace();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  if (!snapshot)
    return (
      <p role="status" className="text-muted py-8">
        Memuat data pengaturan…
      </p>
    );
  async function run(command: SettingsCommand) {
    setError(null);
    setSuccess(null);
    try {
      const id = await executeSettingsCommand(command);
      setSuccess(
        command.type === "add-location"
          ? `Lokasi ${id} berhasil ditambahkan.`
          : "Perubahan pengaturan berhasil disimpan.",
      );
      return id;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Perubahan belum dapat disimpan.",
      );
      return null;
    }
  }
  return (
    <Context.Provider
      value={{
        state: snapshot.data.settings,
        sales: snapshot.data.sales,
        warehouse: snapshot.data.warehouse,
        user,
        run,
        error,
      }}
    >
      {error && (
        <div className="mb-4">
          <Alert tone="danger" title="Periksa pengaturan kembali">
            {error}
          </Alert>
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert tone="success" title="Pengaturan tersimpan">
            {success}
          </Alert>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
export function useSettings() {
  const value = useContext(Context);
  if (!value) throw new Error("SettingsProvider is required");
  return value;
}
