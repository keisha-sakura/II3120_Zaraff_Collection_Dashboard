"use client";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { useSales } from "../../components/sales-provider";
import { MissingSalesRecord, SalesLink } from "../../components/shared";
export function ClaimResultsPage({ id }: { id: string }) {
  const { state } = useSales();
  const live = state.lives.find((live) => live.id === id);
  if (!live) return <MissingSalesRecord label="Live" href="/penjualan/live" />;
  if (!live.claimsProcessed)
    return (
      <EmptyState
        title="Klaim belum diproses"
        action={
          <SalesLink href={`/penjualan/live/${id}/klaim/impor`}>
            Impor klaim
          </SalesLink>
        }
      />
    );
  const winners = live.results.filter((claim) => claim.outcome === "won");
  return (
    <>
      <PageHeader
        title={live.title}
        description={`${formatDate(live.scheduledAt)} · TikTok Live`}
      />
      <div className="mb-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Klaim" value={live.results.length} />
        <StatCard
          label="Menang"
          value={winners.length}
          description={`${new Set(winners.map((claim) => claim.orderId)).size} pesanan dibuat`}
        />
        <StatCard
          label="Ditolak"
          value={
            live.results.filter((claim) => claim.outcome === "rejected").length
          }
        />
        <StatCard
          label="Tidak valid"
          value={
            live.results.filter((claim) => claim.outcome === "invalid").length
          }
        />
      </div>
      <p className="text-muted mb-3 text-sm">
        Klaim valid dengan waktu paling awal hingga milidetik menang. Jika
        waktunya sama, nomor baris sumber yang lebih awal didahulukan.
      </p>
      <DataTable
        caption="Hasil pemrosesan klaim"
        rows={live.results}
        rowKey={(claim) => claim.id}
        columns={[
          {
            id: "time",
            header: "Waktu",
            cell: (claim) => (
              <span className="font-mono whitespace-nowrap">{claim.time}</span>
            ),
          },
          { id: "buyer", header: "Pembeli", cell: (claim) => claim.handle },
          { id: "code", header: "Kode", cell: (claim) => claim.itemCode },
          {
            id: "result",
            header: "Hasil",
            cell: (claim) => (
              <Badge
                tone={
                  claim.outcome === "won"
                    ? "success"
                    : claim.outcome === "rejected"
                      ? "danger"
                      : "warning"
                }
              >
                {claim.outcome === "won"
                  ? "Menang"
                  : claim.outcome === "rejected"
                    ? "Ditolak"
                    : "Tidak Valid"}
              </Badge>
            ),
          },
          { id: "reason", header: "Keterangan", cell: (claim) => claim.reason },
          {
            id: "order",
            header: "Pesanan",
            cell: (claim) =>
              claim.orderId ? (
                <SalesLink href={`/penjualan/pesanan/${claim.orderId}`}>
                  {claim.orderId}
                </SalesLink>
              ) : (
                "—"
              ),
          },
        ]}
      />
      <div className="mt-5">
        <SalesLink href="/penjualan/live">Kembali ke jadwal live</SalesLink>
      </div>
    </>
  );
}
