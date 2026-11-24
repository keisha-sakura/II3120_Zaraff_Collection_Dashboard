"use client";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/format";
import { monthLabel } from "../../model";
import { useReports } from "../../components/reports-provider";
import { ReportsLink } from "../../components/shared";
export function StrategiesPage() {
  const { state } = useReports();
  return (
    <>
      <PageHeader
        title="Strategi Bulanan"
        description="Rencana penjualan yang dikirim ke staf"
        primaryAction={
          <ReportsLink href="/laporan/strategi/baru" primary>
            Tulis strategi
          </ReportsLink>
        }
      />
      <DataTable
        caption="Strategi bulanan"
        rows={[...state.strategies].sort((a, b) =>
          b.month.localeCompare(a.month),
        )}
        rowKey={(row) => row.id}
        rowHref={(row) => `/laporan/strategi/${row.id}/kirim`}
        columns={[
          {
            id: "month",
            header: "Bulan",
            cell: (row) => monthLabel(row.month),
          },
          {
            id: "summary",
            header: "Ringkasan",
            cell: (row) => <p className="max-w-lg truncate">{row.content}</p>,
          },
          { id: "author", header: "Penulis", cell: (row) => row.authorName },
          {
            id: "sent",
            header: "Dikirim ke",
            cell: (row) =>
              row.sentAt
                ? `${row.recipientIds.length} staf · ${formatDate(row.sentAt)}`
                : "Draf · belum dikirim",
          },
        ]}
        emptyMessage="Belum ada strategi bulanan."
      />
    </>
  );
}
