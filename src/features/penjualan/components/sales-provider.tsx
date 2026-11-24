"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useWorkspace, executeSalesCommand } from "@/lib/workspace-store";
import { useDashboardNavigation } from "@/components/layout/dashboard-link";
import { Alert } from "@/components/ui/alert";
import { canAccessPage } from "@/config/pages";
import type { User } from "@/types/domain";
import type { WarehouseState } from "@/features/gudang/model";
import type { SalesState, SalesCommand } from "../model";
type SalesContext = {
  state: SalesState;
  warehouse: WarehouseState;
  directory: User[];
  user: User;
  run: (command: SalesCommand) => Promise<string | null>;
  go: (href: string) => void;
  error: string | null;
};
const Context = createContext<SalesContext | null>(null);
export function SalesProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  const snapshot = useWorkspace();
  const navigation = useDashboardNavigation();
  const [error, setError] = useState<string | null>(null);
  if (!snapshot)
    return (
      <p role="status" className="text-muted py-8">
        Memuat data penjualan…
      </p>
    );
  async function run(command: SalesCommand) {
    try {
      setError(null);
      if (!canAccessPage(user.role, "P02"))
        throw new Error("Aksi ini hanya tersedia untuk Owner dan Admin.");
      return await executeSalesCommand(command);
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
        state: snapshot.data.sales,
        warehouse: snapshot.data.warehouse,
        directory: snapshot.data.directory ?? [],
        user,
        run,
        go: (href) => navigation?.navigate(href),
        error,
      }}
    >
      {error && (
        <div className="mb-4">
          <Alert tone="danger" title="Periksa data kembali">
            {error}
          </Alert>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
export function useSales() {
  const value = useContext(Context);
  if (!value) throw new Error("SalesProvider is required");
  return value;
}
