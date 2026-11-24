"use client";
import type { ReactNode } from "react";
import { DashboardLink } from "@/components/layout/dashboard-link";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { DetailList } from "@/components/ui/detail-list";
import { formatCurrency } from "@/lib/format";
import type { SalesOrder } from "@/features/penjualan/model";
export function PaymentLink({
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
export function MissingPaymentRecord({
  label,
  href = "/pembayaran/validasi",
}: {
  label: string;
  href?: string;
}) {
  return (
    <EmptyState
      title={`${label} tidak ditemukan`}
      description="Periksa kembali kode pada alamat halaman."
      action={<PaymentLink href={href}>Kembali ke daftar</PaymentLink>}
    />
  );
}
export function BillSummary({
  order,
  invoiceId,
  method,
}: {
  order: SalesOrder;
  invoiceId: string;
  method?: string;
}) {
  const percent = order.subtotal
    ? Math.round((order.memberDiscount / order.subtotal) * 100)
    : 0;
  return (
    <Card>
      <h2 className="mb-5 text-base font-bold">Tagihan {invoiceId}</h2>
      <DetailList
        entries={[
          {
            label: "Barang",
            value: (
              <ul className="space-y-1">
                {order.lines.map((line) => (
                  <li key={line.itemId}>
                    {line.itemId} · {line.category} {line.grade}
                  </li>
                ))}
              </ul>
            ),
          },
          { label: "Harga barang", value: formatCurrency(order.subtotal) },
          {
            label: "Diskon member",
            value: order.memberDiscount
              ? `−${formatCurrency(order.memberDiscount)} (${percent}%)`
              : "—",
          },
          ...(method ? [{ label: "Metode pembayaran", value: method }] : []),
          {
            label: "Total tagihan",
            value: <strong>{formatCurrency(order.total)}</strong>,
          },
        ]}
      />
    </Card>
  );
}
