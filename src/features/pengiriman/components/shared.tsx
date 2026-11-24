"use client";
import type { ReactNode } from "react";
import type { SalesOrder } from "@/features/penjualan/model";
import type { WarehouseState } from "@/features/gudang/model";
import { DashboardLink } from "@/components/layout/dashboard-link";
import { EmptyState } from "@/components/ui/empty-state";
export function ShippingLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <DashboardLink
      href={href}
      className="text-primary font-semibold hover:underline"
    >
      {children}
    </DashboardLink>
  );
}
export function MissingShippingRecord() {
  return (
    <EmptyState
      title="Pesanan tidak ditemukan"
      description="Periksa kembali kode pada alamat halaman."
      action={
        <ShippingLink href="/pengiriman/packing">
          Kembali ke antrean packing
        </ShippingLink>
      }
    />
  );
}
export function paymentDate(order: SalesOrder, warehouse: WarehouseState) {
  return (
    warehouse.items
      .filter((item) => order.itemIds.includes(item.id))
      .map((item) => item.soldAt)
      .filter((value): value is string => !!value)
      .sort()
      .at(-1) ?? null
  );
}
