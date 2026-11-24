"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  useDemoWorkspace,
  executeDemoReportsCommand,
} from "@/mocks/store/operations-store";
import { useDashboardNavigation } from "@/components/layout/dashboard-link";
import { Alert } from "@/components/ui/alert";
import type { User } from "@/types/domain";
import type { SalesState } from "@/features/penjualan/model";
import type { WarehouseState } from "@/features/gudang/model";
import type { ReportsState, ReportsCommand } from "../model";
type Value = {
  state: ReportsState;
  sales: SalesState;
  warehouse: WarehouseState;
  month: string;
  user: User;
  run: (command: ReportsCommand) => string | null;
  go: (href: string) => void;
};
const Context = createContext<Value | null>(null);
export function ReportsProvider({
  user,
  month,
  children,
}: {
  user: User;
  month: string;
  children: ReactNode;
}) {
  const snapshot = useDemoWorkspace();
  const navigation = useDashboardNavigation();
  const [error, setError] = useState<string | null>(null);
  if (!snapshot)
    return (
      <p role="status" className="text-muted py-8">
        Memuat data laporan…
      </p>
    );
  function run(command: ReportsCommand) {
    try {
      setError(null);
      return executeDemoReportsCommand(command, user);
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
        state: snapshot.data.reports,
        sales: snapshot.data.sales,
        warehouse: snapshot.data.warehouse,
        user,
        month,
        run,
        go: (href) => navigation?.navigate(href),
      }}
    >
      {snapshot.storageUnavailable && (
        <div className="mb-4">
          <Alert tone="warning" title="Penyimpanan browser tidak tersedia">
            Perubahan demo hanya bertahan selama tab ini terbuka.
          </Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert tone="danger" title="Periksa strategi kembali">
            {error}
          </Alert>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
export function useReports() {
  const value = useContext(Context);
  if (!value) throw new Error("ReportsProvider is required");
  return value;
}
