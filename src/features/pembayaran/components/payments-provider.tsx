"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  useDemoWorkspace,
  executeDemoPaymentCommand,
} from "@/mocks/store/operations-store";
import { useDashboardNavigation } from "@/components/layout/dashboard-link";
import { Alert } from "@/components/ui/alert";
import { canAccessPage } from "@/config/pages";
import type { User } from "@/types/domain";
import type { SalesState } from "@/features/penjualan/model";
import type { WarehouseState } from "@/features/gudang/model";
import type { PaymentsState, PaymentCommand } from "../model";
type Value = {
  state: PaymentsState;
  sales: SalesState;
  warehouse: WarehouseState;
  user: User;
  run: (command: PaymentCommand) => string | null;
  error: string | null;
  go: (href: string) => void;
};
const Context = createContext<Value | null>(null);
export function PaymentsProvider({
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
        Memuat data pembayaran…
      </p>
    );
  function run(command: PaymentCommand) {
    try {
      setError(null);
      if (!canAccessPage(user.role, "Y01"))
        throw new Error(
          "Aksi pembayaran hanya tersedia untuk Owner dan Admin.",
        );
      return executeDemoPaymentCommand(command, user.name);
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
        state: snapshot.data.payments,
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
          <Alert tone="danger" title="Periksa pembayaran kembali">
            {error}
          </Alert>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
export function usePayments() {
  const value = useContext(Context);
  if (!value) throw new Error("PaymentsProvider is required");
  return value;
}
