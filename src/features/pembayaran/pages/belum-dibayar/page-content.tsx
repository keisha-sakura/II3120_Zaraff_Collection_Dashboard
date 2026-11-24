"use client";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { daysSince } from "@/features/gudang/model";
import { formatCurrency, formatDate } from "@/lib/format";
import { usePayments } from "../../components/payments-provider";
export function UnpaidInvoicesPage() {
  const { state, sales } = usePayments();
  const rows = state.invoices
    .filter((invoice) =>
      sales.orders.some(
        (order) =>
          order.id === invoice.orderId &&
          order.status === "awaiting-payment" &&
          order.paymentStatus === "unpaid",
      ),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Belum dibayar" />
      <DataTable
        caption="Tagihan belum dibayar"
        rows={rows}
        rowKey={(invoice) => invoice.id}
        rowHref={(invoice) => `/pembayaran/tagihan/${invoice.id}`}
        columns={[
          {
            id: "id",
            header: "Tagihan",
            cell: (invoice) => (
              <span className="font-semibold whitespace-nowrap">
                {invoice.id}
              </span>
            ),
          },
          {
            id: "order",
            header: "Pesanan",
            cell: (invoice) => invoice.orderId,
          },
          {
            id: "buyer",
            header: "Pembeli",
            cell: (invoice) => {
              const order = sales.orders.find(
                (order) => order.id === invoice.orderId,
              );
              return (
                sales.customers.find(
                  (customer) => customer.id === order?.customerId,
                )?.handle ?? "—"
              );
            },
          },
          {
            id: "total",
            header: "Total",
            cell: (invoice) =>
              formatCurrency(
                sales.orders.find((order) => order.id === invoice.orderId)
                  ?.total ?? 0,
              ),
          },
          {
            id: "created",
            header: "Dibuat",
            cell: (invoice) =>
              `${formatDate(invoice.createdAt)} (${daysSince(invoice.createdAt)} hari)`,
          },
          {
            id: "reminder",
            header: "Pengingat terakhir",
            cell: (invoice) => {
              const last = invoice.events
                .filter((event) => event.type === "reminder")
                .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
              return last ? formatDate(last.occurredAt, true) : "—";
            },
          },
        ]}
        emptyMessage="Tidak ada tagihan yang belum dibayar."
      />
    </>
  );
}
