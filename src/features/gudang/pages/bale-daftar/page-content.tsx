"use client";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/card";
import { FilterSelect } from "@/components/ui/form-field";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/format";
import { daysSince } from "../../model";
import { useWarehouse } from "../../components/warehouse-provider";
import { BaleStatusBadge, Location } from "../../components/shared";
export function BaleListPage() {
  const { state, go } = useWarehouse();
  const [status, setStatus] = useState("all");
  const [supplier, setSupplier] = useState("all");
  const [period, setPeriod] = useState("all");
  const rows = state.bales
    .filter(
      (bale) =>
        (status === "all" || bale.status === status) &&
        (supplier === "all" || bale.supplier === supplier) &&
        (period === "all" || daysSince(bale.receivedAt) <= Number(period)),
    )
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  return (
    <>
      <PageHeader
        title="Bale dan Sortir"
        primaryAction={
          <Button onClick={() => go("/gudang/bale/baru")}>Terima bale</Button>
        }
      />
      <div className="mb-5 grid gap-3.5 sm:grid-cols-3">
        <StatCard
          label="Bale belum dibuka"
          value={state.bales.filter((bale) => bale.status === "stored").length}
        />
        <StatCard
          label="Sedang disortir"
          value={state.bales.filter((bale) => bale.status === "sorting").length}
        />
        <StatCard
          label="Retur ke supplier"
          value={state.returns.length}
          description="total tercatat"
        />
      </div>
      <div className="mb-4 flex flex-wrap gap-2.5">
        <FilterSelect
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">Semua</option>
          <option value="stored">Di Gudang</option>
          <option value="sorting">Sedang Disortir</option>
          <option value="sorted">Selesai Disortir</option>
        </FilterSelect>
        <FilterSelect
          label="Supplier"
          value={supplier}
          onChange={(event) => setSupplier(event.target.value)}
        >
          <option value="all">Semua</option>
          {[...new Set(state.bales.map((bale) => bale.supplier))].map(
            (value) => (
              <option key={value}>{value}</option>
            ),
          )}
        </FilterSelect>
        <FilterSelect
          label="Diterima"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        >
          <option value="all">Semua waktu</option>
          <option value="30">30 hari terakhir</option>
          <option value="7">7 hari terakhir</option>
        </FilterSelect>
      </div>
      <DataTable
        caption="Daftar bale"
        rows={rows}
        rowKey={(bale) => bale.id}
        rowHref={(bale) => `/gudang/bale/${bale.id}`}
        columns={[
          {
            id: "id",
            header: "ID Bale",
            cell: (bale) => (
              <span className="font-semibold whitespace-nowrap">{bale.id}</span>
            ),
          },
          { id: "supplier", header: "Supplier", cell: (bale) => bale.supplier },
          { id: "category", header: "Jenis", cell: (bale) => bale.category },
          {
            id: "weight",
            header: "Berat",
            cell: (bale) => `${bale.weightKg} kg`,
          },
          {
            id: "date",
            header: "Diterima",
            cell: (bale) => formatDate(bale.receivedAt),
          },
          {
            id: "location",
            header: "Lokasi",
            cell: (bale) => <Location code={bale.locationId} />,
          },
          {
            id: "status",
            header: "Status",
            cell: (bale) => <BaleStatusBadge status={bale.status} />,
          },
        ]}
        emptyMessage="Tidak ada bale yang sesuai filter."
      />
    </>
  );
}
