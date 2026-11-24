"use client";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";
import { usePayments } from "../../components/payments-provider";
export function PendingPaymentsPage() {
  const { state, sales } = usePayments();
  const rows = state.attempts
    .filter((attempt) => attempt.status === "pending")
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return (
    <>
      <PageHeader title="Menunggu validasi" />
      <DataTable
        caption="Pembayaran menunggu validasi"
        rows={rows}
        rowKey={(attempt) => attempt.id}
        rowHref={(attempt) =>
          `/pembayaran/validasi/${attempt.id}/${attempt.method}`
        }
        columns={[
          {
            id: "order",
            header: "Pesanan",
            cell: (attempt) => (
              <span className="font-semibold whitespace-nowrap">
                {attempt.orderId}
              </span>
            ),
          },
          {
            id: "buyer",
            header: "Pembeli",
            cell: (attempt) => {
              const order = sales.orders.find(
                (order) => order.id === attempt.orderId,
              );
              const customer = sales.customers.find(
                (customer) => customer.id === order?.customerId,
              );
              return `${customer?.handle ?? "—"}${customer?.isMember ? " · Member" : ""}`;
            },
          },
          {
            id: "method",
            header: "Metode",
            cell: (attempt) =>
              attempt.method === "transfer" ? "Transfer" : "Saldo deposit",
          },
          {
            id: "amount",
            header: "Nominal",
            cell: (attempt) => formatCurrency(attempt.amount),
          },
          {
            id: "total",
            header: "Total tagihan",
            cell: (attempt) =>
              formatCurrency(
                sales.orders.find((order) => order.id === attempt.orderId)
                  ?.total ?? 0,
              ),
          },
          {
            id: "date",
            header: "Diajukan",
            cell: (attempt) => formatDate(attempt.submittedAt, true),
          },
        ]}
        emptyMessage="Tidak ada pembayaran yang menunggu validasi."
      />
    </>
  );
}
