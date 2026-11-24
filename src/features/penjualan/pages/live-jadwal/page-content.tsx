"use client";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/format";
import { useSales } from "../../components/sales-provider";
export function LiveSchedulePage() {
  const { state, user, run, go } = useSales();
  const notice = useSearchParams().get("saved");
  const hostOnly = user.role === "live-host";
  const lives = state.lives.filter(
    (live) => !hostOnly || live.hostId === user.id,
  );
  const upcoming = lives
    .filter((live) => live.status !== "completed")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const completed = lives
    .filter((live) => live.status === "completed")
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  function start() {
    if (run({ type: "start-draft" })) go("/penjualan/live/baru/konten");
  }
  return (
    <>
      <PageHeader
        title={hostOnly ? "Jadwal Live" : "Jadwal Live dan Promosi"}
        primaryAction={
          !hostOnly && <Button onClick={start}>Jadwalkan live</Button>
        }
      />
      {notice && (
        <p role="status" className="text-success mb-4 text-sm">
          {notice === "published"
            ? "Promosi ditandai dipublikasikan dalam demo."
            : "Draf live berhasil disimpan."}
        </p>
      )}
      <section className="mb-7" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="mb-3 text-base font-bold">
          Akan datang
        </h2>
        <DataTable
          caption="Jadwal live yang akan datang"
          rows={upcoming}
          rowKey={(live) => live.id}
          rowHref={hostOnly ? undefined : () => "/penjualan/live/baru/konten"}
          beforeRowNavigate={(live) =>
            !!run({ type: "start-draft", liveId: live.id })
          }
          columns={[
            {
              id: "title",
              header: "Live",
              cell: (live) => (
                <span className="font-semibold">{live.title}</span>
              ),
            },
            {
              id: "date",
              header: "Jadwal (WIB)",
              cell: (live) => formatDate(live.scheduledAt, true),
            },
            {
              id: "platform",
              header: "Platform",
              cell: (live) => live.platform,
            },
            {
              id: "items",
              header: "Barang",
              cell: (live) => live.itemIds.length,
            },
            {
              id: "status",
              header: "Promosi",
              cell: (live) => (
                <Badge
                  tone={live.status === "published" ? "success" : "neutral"}
                >
                  {live.status === "published" ? "Dipublikasikan" : "Draf"}
                </Badge>
              ),
            },
          ]}
          emptyMessage="Belum ada jadwal live yang ditugaskan."
        />
      </section>
      <section aria-labelledby="completed-heading">
        <h2 id="completed-heading" className="mb-3 text-base font-bold">
          Selesai
        </h2>
        <DataTable
          caption="Live selesai"
          rows={completed}
          rowKey={(live) => live.id}
          rowHref={
            hostOnly
              ? undefined
              : (live) =>
                  `/penjualan/live/${live.id}/klaim${live.claimsProcessed ? "" : "/impor"}`
          }
          columns={[
            {
              id: "title",
              header: "Live",
              cell: (live) => (
                <span className="font-semibold">{live.title}</span>
              ),
            },
            {
              id: "date",
              header: "Tanggal",
              cell: (live) => formatDate(live.scheduledAt),
            },
            ...(hostOnly
              ? [
                  {
                    id: "platform",
                    header: "Platform",
                    cell: (live: (typeof completed)[number]) => live.platform,
                  },
                ]
              : [
                  {
                    id: "claims",
                    header: "Klaim",
                    cell: (live: (typeof completed)[number]) =>
                      live.claimsProcessed ? live.results.length : "—",
                  },
                  {
                    id: "winners",
                    header: "Pemenang",
                    cell: (live: (typeof completed)[number]) =>
                      live.claimsProcessed
                        ? live.results.filter(
                            (claim) => claim.outcome === "won",
                          ).length
                        : "—",
                  },
                  {
                    id: "result",
                    header: "Rekap klaim",
                    cell: (live: (typeof completed)[number]) => (
                      <Badge
                        tone={live.claimsProcessed ? "success" : "warning"}
                      >
                        {live.claimsProcessed
                          ? "Sudah diproses"
                          : "Belum diimpor"}
                      </Badge>
                    ),
                  },
                ]),
          ]}
          emptyMessage="Belum ada live yang selesai."
        />
      </section>
    </>
  );
}
