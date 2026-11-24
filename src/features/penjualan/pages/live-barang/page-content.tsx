"use client";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { DataTable } from "@/components/ui/data-table";
import { FilterSelect } from "@/components/ui/form-field";
import { LocationBadge } from "@/components/ui/badge";
import { categories } from "@/features/gudang/model";
import { formatCurrency } from "@/lib/format";
import { useSales } from "../../components/sales-provider";
import { DraftRequired, LiveSteps } from "../../components/shared";
export function LiveItemsPage() {
  const { state, warehouse, run, go } = useSales();
  const [selected, setSelected] = useState<string[]>(
    state.draft?.itemIds ?? [],
  );
  const [category, setCategory] = useState("all");
  if (
    !state.draft?.title ||
    !Number.isFinite(Date.parse(state.draft.scheduledAt))
  )
    return <DraftRequired />;
  const available = warehouse.items.filter(
    (item) =>
      item.status === "available" &&
      item.grade !== null &&
      item.price !== null &&
      item.price > 0,
  );
  const selectedIds = selected.filter((id) =>
    available.some((item) => item.id === id),
  );
  const rows = available.filter(
    (item) => category === "all" || item.category === category,
  );
  function next() {
    if (run({ type: "select-items", itemIds: selectedIds }))
      go("/penjualan/live/baru/publikasi");
  }
  return (
    <>
      <PageHeader title="Jadwalkan live" />
      <LiveSteps step="items" />
      {selected.length !== selectedIds.length && (
        <div className="mb-4">
          <Alert tone="warning" title="Pilihan barang diperbarui">
            Barang yang sudah tidak tersedia dilepas dari pilihan. Pilih barang
            pengganti bila diperlukan.
          </Alert>
        </div>
      )}
      <div className="mb-4 flex items-center justify-between gap-3">
        <FilterSelect
          label="Kategori"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">Semua</option>
          {categories.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </FilterSelect>
        <p role="status" className="text-muted text-sm">
          {selectedIds.length} dipilih
        </p>
      </div>
      <DataTable
        caption="Pilih barang tersedia untuk live"
        rows={rows}
        rowKey={(item) => item.id}
        columns={[
          {
            id: "select",
            header: "Pilih",
            cell: (item) => (
              <input
                type="checkbox"
                aria-label={`Pilih ${item.id}`}
                checked={selectedIds.includes(item.id)}
                disabled={
                  item.grade === null || item.price === null || item.price <= 0
                }
                onChange={(event) =>
                  setSelected(
                    event.target.checked
                      ? [...selectedIds, item.id]
                      : selectedIds.filter((id) => id !== item.id),
                  )
                }
                className="accent-primary size-4"
              />
            ),
          },
          { id: "id", header: "Kode", cell: (item) => item.id },
          { id: "category", header: "Kategori", cell: (item) => item.category },
          { id: "grade", header: "Grade", cell: (item) => item.grade ?? "—" },
          {
            id: "price",
            header: "Harga",
            cell: (item) =>
              item.price === null ? "—" : formatCurrency(item.price),
          },
          {
            id: "location",
            header: "Lokasi",
            cell: (item) =>
              item.locationId ? (
                <LocationBadge>{item.locationId}</LocationBadge>
              ) : (
                "—"
              ),
          },
        ]}
        emptyMessage="Tidak ada barang tersedia yang sesuai filter."
      />
      <div className="mt-5 flex justify-end gap-3">
        <Button
          variant="text"
          onClick={() => go("/penjualan/live/baru/konten")}
        >
          Kembali
        </Button>
        <Button onClick={next}>Lanjut tinjau</Button>
      </div>
    </>
  );
}
