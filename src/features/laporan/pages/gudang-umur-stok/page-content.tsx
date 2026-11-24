"use client";
import { PageHeader } from "@/components/layout/page-header";
import { Card, StatCard } from "@/components/ui/card";
import { BarChart } from "@/components/ui/bar-chart";
import { DataTable } from "@/components/ui/data-table";
import { useReports } from "../../components/reports-provider";
import { MonthFilter } from "../../components/shared";
import { ageBuckets, monthOf } from "../../selectors";
export function StockAgePage() {
  const { warehouse, month } = useReports();
  const count = (status: string) =>
    warehouse.items.filter((item) => item.status === status).length;
  const available = warehouse.items.filter(
    (item) => item.status === "available",
  );
  const rows = [...new Set(available.map((item) => item.category))]
    .sort()
    .map((category) => ({
      category,
      A: available.filter(
        (item) => item.category === category && item.grade === "A",
      ).length,
      B: available.filter(
        (item) => item.category === category && item.grade === "B",
      ).length,
      C: available.filter(
        (item) => item.category === category && item.grade === "C",
      ).length,
    }));
  return (
    <>
      <PageHeader title="Gudang dan Umur Stok" />
      <MonthFilter />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Bale di gudang"
          value={
            warehouse.bales.filter((bale) => bale.status !== "sorted").length
          }
          description={`${warehouse.bales.filter((bale) => bale.status === "sorting").length} sedang disortir`}
        />
        <StatCard label="Di laundry" value={count("laundry")} />
        <StatCard
          label="Tersedia"
          value={count("available")}
          description="siap dijual"
        />
        <StatCard
          label="Dipesan"
          value={count("reserved")}
          description="menunggu bayar"
        />
        <StatCard label="Terjual, menunggu kirim" value={count("sold")} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Keluar gudang"
          value={
            warehouse.items.filter(
              (item) => item.outboundAt && monthOf(item.outboundAt) === month,
            ).length
          }
          description="dalam periode"
        />
        <StatCard
          label="Diretur"
          value={
            warehouse.returns.filter((row) => monthOf(row.createdAt) === month)
              .length
          }
          description="dalam periode"
        />
        <StatCard
          label="Dihapusbukukan"
          value={count("written-off")}
          description="posisi saat ini"
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BarChart title="Umur stok tersedia" values={ageBuckets(warehouse)} />
        <Card>
          <h2 className="mb-4 font-bold">Tersedia per kategori dan grade</h2>
          <DataTable
            caption="Stok tersedia per kategori dan grade"
            rows={rows}
            rowKey={(row) => row.category}
            columns={[
              {
                id: "category",
                header: "Kategori",
                cell: (row) => row.category,
              },
              ...(["A", "B", "C"] as const).map((grade) => ({
                id: grade,
                header: grade,
                cell: (row: (typeof rows)[number]) => row[grade],
              })),
              {
                id: "total",
                header: "Jumlah",
                cell: (row) => row.A + row.B + row.C,
              },
            ]}
          />
        </Card>
      </div>
      <p className="text-muted mt-4 text-xs">
        Posisi stok dan umur stok memakai acuan demo 24 November 2026. Filter
        periode berlaku untuk barang keluar dan retur.
      </p>
    </>
  );
}
