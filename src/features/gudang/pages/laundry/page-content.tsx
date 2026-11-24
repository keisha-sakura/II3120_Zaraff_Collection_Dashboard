"use client";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/format";
import { daysSince } from "../../model";
import { useWarehouse } from "../../components/warehouse-provider";
export function LaundryPage() {
  const { state } = useWarehouse();
  return (
    <>
      <PageHeader title="Laundry" />
      <DataTable
        caption="Barang di laundry; pilih baris untuk grading"
        rows={state.items
          .filter((item) => item.status === "laundry")
          .sort((a, b) => a.id.localeCompare(b.id))}
        rowKey={(item) => item.id}
        rowHref={(item) => `/gudang/laundry/${item.id}/grading`}
        columns={[
          {
            id: "id",
            header: "Kode",
            cell: (item) => (
              <span className="font-semibold whitespace-nowrap">{item.id}</span>
            ),
          },
          { id: "bale", header: "Bale", cell: (item) => item.baleId },
          { id: "category", header: "Kategori", cell: (item) => item.category },
          {
            id: "condition",
            header: "Kondisi",
            cell: (item) => item.condition,
          },
          {
            id: "date",
            header: "Dikirim",
            cell: (item) => (item.laundryAt ? formatDate(item.laundryAt) : "—"),
          },
          {
            id: "days",
            header: "Hari",
            cell: (item) =>
              item.laundryAt ? `${daysSince(item.laundryAt)} hari` : "—",
          },
        ]}
        emptyMessage="Semua barang sudah selesai laundry atau belum ada barang yang dikirim."
      />
    </>
  );
}
