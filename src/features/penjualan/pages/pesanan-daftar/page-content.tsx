"use client";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { FilterSelect } from "@/components/ui/form-field";
import { orderStatuses } from "@/config/statuses";
import { monthOf } from "@/features/laporan/selectors";
import { formatCurrency, formatDate } from "@/lib/format";
import { useSales } from "../../components/sales-provider";
export function OrdersPage() {
  const { state } = useSales();
  const [status, setStatus] = useState("active");
  const [period, setPeriod] = useState("month");
  const rows = state.orders.filter(
    (order) =>
      (status === "all" ||
        (status === "active" && order.status !== "completed") ||
        order.status === status) &&
      (period === "all" ||
        monthOf(order.createdAt) === monthOf(new Date().toISOString())),
  );
  return (
    <>
      <PageHeader title="Pesanan" />
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <FilterSelect
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="active">Aktif</option>
          <option value="all">Semua</option>
          {Object.entries(orderStatuses).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Dibuat"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        >
          <option value="month">Bulan ini</option>
          <option value="all">Semua waktu</option>
        </FilterSelect>
        <p role="status" className="text-muted ml-auto text-sm">
          {rows.length} pesanan
        </p>
      </div>
      <DataTable
        caption="Daftar pesanan"
        rows={rows}
        rowKey={(order) => order.id}
        rowHref={(order) => `/penjualan/pesanan/${order.id}`}
        columns={[
          {
            id: "id",
            header: "Pesanan",
            cell: (order) => (
              <span className="font-semibold whitespace-nowrap">
                {order.id}
              </span>
            ),
          },
          {
            id: "date",
            header: "Dibuat",
            cell: (order) => formatDate(order.createdAt),
          },
          {
            id: "customer",
            header: "Pembeli",
            cell: (order) =>
              state.customers.find(
                (customer) => customer.id === order.customerId,
              )?.handle ?? "—",
          },
          {
            id: "items",
            header: "Barang",
            cell: (order) => order.itemIds.join(", "),
          },
          {
            id: "total",
            header: "Total",
            cell: (order) => formatCurrency(order.total),
          },
          {
            id: "status",
            header: "Status",
            cell: (order) => (
              <Badge tone={orderStatuses[order.status].tone}>
                {orderStatuses[order.status].label}
              </Badge>
            ),
          },
        ]}
        emptyMessage="Tidak ada pesanan yang sesuai filter."
      />
    </>
  );
}
