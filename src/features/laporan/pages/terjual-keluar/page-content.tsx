"use client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/format";
import { useReports } from "../../components/reports-provider";
import { MonthFilter } from "../../components/shared";
import { reportData } from "../../selectors";
import { downloadCsv } from "../../csv";
export function SoldOutboundPage() {
  const { warehouse, sales, month } = useReports();
  const data = reportData(warehouse, sales, month);
  return (
    <>
      <PageHeader
        title="Barang Terjual dan Keluar"
        secondaryAction={
          <Button
            variant="secondary"
            onClick={() =>
              downloadCsv(`terjual-keluar-${month}.csv`, [
                [
                  "Kode",
                  "Kategori",
                  "Grade",
                  "Harga jual setelah diskon",
                  "Terjual",
                  "Keluar gudang",
                  "Pesanan",
                ],
                ...data.sold.map((item) => [
                  item.id,
                  item.category,
                  item.grade ?? "",
                  item.netPrice,
                  item.soldAt!,
                  item.outboundAt ?? "",
                  item.saleOrderId ?? "",
                ]),
              ])
            }
          >
            Unduh CSV
          </Button>
        }
      />
      <MonthFilter label="Periode terjual" />
      <DataTable
        caption="Barang terjual dan keluar gudang"
        rows={data.sold}
        rowKey={(item) => item.id}
        rowHref={(item) => `/gudang/inventaris/${item.id}`}
        columns={[
          {
            id: "code",
            header: "Kode",
            cell: (item) => (
              <span className="font-mono whitespace-nowrap">{item.id}</span>
            ),
          },
          { id: "category", header: "Kategori", cell: (item) => item.category },
          { id: "grade", header: "Grade", cell: (item) => item.grade ?? "—" },
          {
            id: "price",
            header: "Harga jual",
            cell: (item) => formatCurrency(item.netPrice),
          },
          {
            id: "sold",
            header: "Terjual",
            cell: (item) => formatDate(item.soldAt!),
          },
          {
            id: "outbound",
            header: "Keluar gudang",
            cell: (item) =>
              item.outboundAt ? (
                formatDate(item.outboundAt)
              ) : (
                <Badge tone="warning">belum</Badge>
              ),
          },
          {
            id: "order",
            header: "Pesanan",
            cell: (item) => item.saleOrderId ?? "—",
          },
        ]}
        emptyMessage="Belum ada barang terjual pada periode ini."
      />
      <p className="mt-4 flex flex-wrap justify-between gap-3 text-sm font-semibold">
        <span>
          {data.sold.length} barang ·{" "}
          {data.sold.filter((item) => item.outboundAt).length} sudah keluar
          gudang
        </span>
        <span>{formatCurrency(data.revenue)}</span>
      </p>
    </>
  );
}
