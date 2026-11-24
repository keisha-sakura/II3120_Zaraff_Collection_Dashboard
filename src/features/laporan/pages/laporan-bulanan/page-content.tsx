"use client";
import { PageHeader } from "@/components/layout/page-header";
import { Card, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/format";
import { reportData } from "../../selectors";
import { downloadCsv } from "../../csv";
import { useReports } from "../../components/reports-provider";
import { MonthFilter } from "../../components/shared";
export function MonthlyReportPage() {
  const { warehouse, sales, month } = useReports();
  const data = reportData(warehouse, sales, month);
  function exportCsv() {
    downloadCsv(`laporan-bulanan-${month}.csv`, [
      ["Bulan", month],
      ["Metrik", "Nilai"],
      ["Barang terjual", data.sold.length],
      ["Pendapatan setelah diskon", data.revenue],
      ["Retur", data.returns],
      ["Stok akhir bulan", data.closing.length],
      [],
      ["Kategori", "Terjual", "Pendapatan"],
      ...data.categories.map((row) => [row.category, row.count, row.revenue]),
      ["Total", data.sold.length, data.revenue],
      [],
      ["Grade", "Stok"],
      ...data.grades.map((row) => [row.grade, row.count]),
    ]);
  }
  return (
    <>
      <PageHeader
        title="Laporan Bulanan"
        secondaryAction={
          <Button variant="secondary" onClick={exportCsv}>
            Ekspor CSV
          </Button>
        }
      />
      <MonthFilter label="Bulan" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Barang terjual" value={data.sold.length} />
        <StatCard
          label="Pendapatan"
          value={formatCurrency(data.revenue)}
          description="setelah diskon"
        />
        <StatCard label="Retur" value={data.returns} />
        <StatCard
          label="Stok akhir bulan"
          value={data.closing.length}
          description="Tersedia + Dipesan"
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="mb-4 font-bold">Penjualan per kategori</h2>
          <DataTable
            caption="Penjualan per kategori"
            rows={data.categories}
            rowKey={(row) => row.category}
            columns={[
              {
                id: "category",
                header: "Kategori",
                cell: (row) => row.category,
              },
              { id: "count", header: "Terjual", cell: (row) => row.count },
              {
                id: "revenue",
                header: "Pendapatan",
                cell: (row) => formatCurrency(row.revenue),
              },
            ]}
            emptyMessage="Belum ada penjualan pada bulan ini."
          />
          <p className="mt-4 flex justify-between gap-3 font-bold">
            <span>Total · {data.sold.length} barang</span>
            <span>{formatCurrency(data.revenue)}</span>
          </p>
        </Card>
        <Card>
          <h2 className="mb-4 font-bold">Stok per grade</h2>
          <DataTable
            caption="Stok akhir bulan per grade"
            rows={data.grades}
            rowKey={(row) => row.grade}
            columns={[
              {
                id: "grade",
                header: "Grade",
                cell: (row) => `Grade ${row.grade}`,
              },
              { id: "count", header: "Stok", cell: (row) => row.count },
            ]}
          />
        </Card>
      </div>
      <p className="text-muted mt-4 text-xs">
        Stok akhir bulan direkonstruksi dari tanggal tersedia dan terjual yang
        tercatat pada data demo. Bulan berjalan menampilkan data sampai saat
        ini.
      </p>
    </>
  );
}
