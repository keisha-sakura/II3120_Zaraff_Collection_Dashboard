"use client";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { FilterSelect } from "@/components/ui/form-field";
import { SearchInput } from "@/components/ui/search-input";
import { formatCurrency } from "@/lib/format";
import { itemStatuses } from "@/config/statuses";
import { categories } from "../../model";
import { useWarehouse } from "../../components/warehouse-provider";
import { Location, ItemStatusBadge } from "../../components/shared";
export function InventoryPage() {
  const { state } = useWarehouse();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [grade, setGrade] = useState("all");
  const [status, setStatus] = useState("all");
  const rows = state.items.filter(
    (item) =>
      item.id.toLowerCase().includes(query.trim().toLowerCase()) &&
      (category === "all" || item.category === category) &&
      (grade === "all" || item.grade === grade) &&
      (status === "all" || item.status === status),
  );
  return (
    <>
      <PageHeader title="Inventaris" />
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="w-full sm:w-64">
          <SearchInput
            aria-label="Cari kode barang"
            placeholder="Cari kode barang"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
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
        <FilterSelect
          label="Grade"
          value={grade}
          onChange={(event) => setGrade(event.target.value)}
        >
          <option value="all">Semua</option>
          {["A", "B", "C"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">Semua</option>
          {Object.entries(itemStatuses).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </FilterSelect>
        <p role="status" className="text-muted ml-auto text-sm">
          {rows.length} barang
        </p>
      </div>
      <DataTable
        caption="Inventaris barang"
        rows={rows}
        rowKey={(item) => item.id}
        rowHref={(item) => `/gudang/inventaris/${item.id}`}
        columns={[
          {
            id: "id",
            header: "Kode",
            cell: (item) => (
              <span className="font-semibold whitespace-nowrap">{item.id}</span>
            ),
          },
          { id: "category", header: "Kategori", cell: (item) => item.category },
          { id: "grade", header: "Grade", cell: (item) => item.grade ?? "—" },
          {
            id: "price",
            header: "Harga",
            cell: (item) =>
              item.price === null ? "—" : formatCurrency(item.price),
          },
          {
            id: "status",
            header: "Status",
            cell: (item) => <ItemStatusBadge status={item.status} />,
          },
          {
            id: "location",
            header: "Lokasi",
            cell: (item) => <Location code={item.locationId} />,
          },
        ]}
        emptyMessage="Tidak ada barang yang sesuai pencarian atau filter."
      />
    </>
  );
}
