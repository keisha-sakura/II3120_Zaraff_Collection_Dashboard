"use client";
import { PageHeader } from "@/components/layout/page-header";
import { Card, StatCard } from "@/components/ui/card";
import { BarChart } from "@/components/ui/bar-chart";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";
import { ageBuckets, reportData, monthOf } from "../../selectors";
import { useReports } from "../../components/reports-provider";
import { MonthFilter, ReportsLink } from "../../components/shared";
export function BusinessSummaryPage() {
  const { warehouse, sales, month } = useReports();
  const data = reportData(warehouse, sales, month);
  const activity = warehouse.movements
    .filter((row) => monthOf(row.occurredAt) === month)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 5);
  return (
    <>
      <PageHeader title="Ringkasan Bisnis" />
      <MonthFilter />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Barang terjual"
          value={data.sold.length}
          description={formatCurrency(data.revenue)}
        />
        <StatCard
          label="Stok tersedia"
          value={
            warehouse.items.filter((item) => item.status === "available").length
          }
          description="posisi saat ini"
        />
        <StatCard
          label="Pesanan aktif"
          value={
            sales.orders.filter((order) => order.status !== "completed").length
          }
          description="belum selesai · saat ini"
        />
        <StatCard
          label="Menunggu validasi"
          value={
            sales.orders.filter((order) => order.paymentStatus === "pending")
              .length
          }
          description="pembayaran · saat ini"
        />
        <StatCard
          label="Pengiriman berjalan"
          value={
            sales.orders.filter(
              (order) =>
                order.status === "shipped" &&
                order.shipment?.status !== "delivered",
            ).length
          }
          description="belum diterima · saat ini"
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BarChart title="Umur stok tersedia" values={ageBuckets(warehouse)} />
        <Card>
          <h2 className="mb-4 font-bold">Aktivitas terbaru</h2>
          <DataTable
            caption="Aktivitas gudang dalam periode"
            rows={activity}
            rowKey={(row) => row.id}
            columns={[
              {
                id: "time",
                header: "Waktu",
                cell: (row) => formatDate(row.occurredAt, true),
              },
              { id: "entity", header: "Objek", cell: (row) => row.entityId },
              { id: "change", header: "Perubahan", cell: (row) => row.action },
            ]}
            emptyMessage="Belum ada aktivitas pada periode ini."
          />
        </Card>
      </div>
      <div className="mt-4">
        <ReportsLink href="/laporan/umur-stok">
          Lihat detail gudang dan umur stok
        </ReportsLink>
      </div>
    </>
  );
}
