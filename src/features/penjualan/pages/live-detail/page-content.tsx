"use client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { itemStatuses } from "@/config/statuses";
import { formatCurrency, formatDate } from "@/lib/format";
import { useSales } from "../../components/sales-provider";
import { MissingSalesRecord, SalesLink } from "../../components/shared";
import { LiveSummary } from "../../components/live-summary";

export function LiveDetailPage({ id }: { id: string }) {
  const { state, warehouse, directory, run, go } = useSales();
  const live = state.lives.find((row) => row.id === id);
  if (!live) return <MissingSalesRecord label="Live" href="/penjualan/live" />;
  const items = live.itemIds.flatMap((itemId) =>
    warehouse.items.filter((item) => item.id === itemId),
  );
  async function edit() {
    if (await run({ type: "start-draft", liveId: id }))
      go("/penjualan/live/baru/konten");
  }
  return (
    <>
      <PageHeader
        title={live.title}
        description={`${formatDate(live.scheduledAt, true)} WIB · ${live.platform}`}
        cancelAction={
          <SalesLink href="/penjualan/live">Kembali ke jadwal</SalesLink>
        }
        secondaryAction={
          live.status === "published" && (
            <Button variant="secondary" onClick={edit}>
              Edit live
            </Button>
          )
        }
        primaryAction={
          live.status === "published" ? (
            <Button
              onClick={async () => {
                if (await run({ type: "complete-live", liveId: id }))
                  go(`/penjualan/live/${id}/klaim/impor`);
              }}
            >
              Selesaikan live
            </Button>
          ) : live.status === "draft" ? (
            <Button onClick={edit}>Lanjutkan draf</Button>
          ) : (
            <SalesLink
              href={`/penjualan/live/${id}/klaim${live.claimsProcessed ? "" : "/impor"}`}
            >
              {live.claimsProcessed ? "Lihat hasil klaim" : "Impor klaim"}
            </SalesLink>
          )
        }
      />
      <Card className="mb-5">
        <div className="mb-5">
          <Badge
            tone={
              live.status === "published"
                ? "success"
                : live.status === "completed"
                  ? "neutral"
                  : "warning"
            }
          >
            {live.status === "published"
              ? "Dipublikasikan"
              : live.status === "completed"
                ? "Selesai"
                : "Draf"}
          </Badge>
        </div>
        <LiveSummary
          live={live}
          items={items}
          hostName={
            directory.find((user) => user.id === live.hostId)?.name ??
            live.hostId
          }
        />
      </Card>
      <Card>
        <h2 className="mb-4 font-bold">Barang live</h2>
        <DataTable
          caption="Barang yang terdaftar pada live"
          rows={items}
          rowKey={(item) => item.id}
          rowHref={(item) => `/gudang/inventaris/${item.id}`}
          columns={[
            {
              id: "code",
              header: "Kode barang",
              cell: (item) => (
                <span className="font-mono whitespace-nowrap">{item.id}</span>
              ),
            },
            {
              id: "category",
              header: "Kategori",
              cell: (item) => item.category,
            },
            { id: "grade", header: "Grade", cell: (item) => item.grade ?? "—" },
            {
              id: "price",
              header: "Harga",
              cell: (item) =>
                item.price === null ? "—" : formatCurrency(item.price),
            },
            {
              id: "status",
              header: "Status barang",
              cell: (item) => (
                <Badge tone={itemStatuses[item.status].tone}>
                  {itemStatuses[item.status].label}
                </Badge>
              ),
            },
          ]}
          emptyMessage="Belum ada barang terdaftar pada live ini."
        />
      </Card>
    </>
  );
}
