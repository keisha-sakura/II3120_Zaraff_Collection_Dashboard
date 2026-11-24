"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { User } from "@/types/domain";
import type { WarehouseCommand, WarehouseState } from "../model";
import { executeWarehouseCommand, useWarehouseSnapshot } from "../store";
import { Alert } from "@/components/ui/alert";
import { useDashboardNavigation } from "@/components/layout/dashboard-link";
import type { PriceRules } from "@/features/pengaturan/model";

type WarehouseContextValue = {
  state: WarehouseState;
  priceRules: PriceRules;
  user: User;
  go: (href: string) => void;
  run: (command: WarehouseCommand) => string | null;
  error: string | null;
};
const WarehouseContext = createContext<WarehouseContextValue | null>(null);
export function WarehouseProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  const snapshot = useWarehouseSnapshot();
  const navigation = useDashboardNavigation();
  const [error, setError] = useState<string | null>(null);
  if (!snapshot)
    return (
      <p role="status" className="text-muted py-8">
        Memuat data gudang…
      </p>
    );
  function run(command: WarehouseCommand) {
    try {
      setError(null);
      return executeWarehouseCommand(command, user.name);
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
    <WarehouseContext.Provider
      value={{
        state: snapshot.data,
        priceRules: snapshot.priceRules,
        user,
        go: (href) => navigation?.navigate(href),
        run,
        error,
      }}
    >
      {snapshot.storageUnavailable && (
        <div className="mb-4">
          <Alert tone="warning" title="Penyimpanan browser tidak tersedia">
            Perubahan demo hanya tersimpan selama tab ini terbuka.
          </Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert tone="danger" title="Periksa data kembali">
            {error}
          </Alert>
        </div>
      )}
      {children}
    </WarehouseContext.Provider>
  );
}
export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (!context) throw new Error("WarehouseProvider is required");
  return context;
}
