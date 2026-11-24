"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  useDemoWorkspace,
  executeDemoShippingCommand,
} from "@/mocks/store/operations-store";
import { useDashboardNavigation } from "@/components/layout/dashboard-link";
import { Alert } from "@/components/ui/alert";
import type { User } from "@/types/domain";
import type { SalesState } from "@/features/penjualan/model";
import type { WarehouseState } from "@/features/gudang/model";
import type { ShippingState, ShippingCommand } from "../model";
type Value = {
  state: ShippingState;
  sales: SalesState;
  warehouse: WarehouseState;
  user: User;
  run: (command: ShippingCommand) => string | null;
  go: (href: string) => void;
  error: string | null;
};
const Context = createContext<Value | null>(null);
export function ShippingProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  const snapshot = useDemoWorkspace();
  const navigation = useDashboardNavigation();
  const [error, setError] = useState<string | null>(null);
  if (!snapshot)
    return (
      <p role="status" className="text-muted py-8">
        Memuat data pengiriman…
      </p>
    );
  function run(command: ShippingCommand) {
    try {
      setError(null);
      return executeDemoShippingCommand(command, user);
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
        state: snapshot.data.shipping,
        sales: snapshot.data.sales,
        warehouse: snapshot.data.warehouse,
        user,
        run,
        error,
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
          <Alert tone="danger" title="Periksa pengiriman kembali">
            {error}
          </Alert>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
export function useShipping() {
  const value = useContext(Context);
  if (!value) throw new Error("ShippingProvider is required");
  return value;
}
