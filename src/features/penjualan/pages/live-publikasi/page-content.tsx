"use client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailList } from "@/components/ui/detail-list";
import { formatCurrency, formatDate } from "@/lib/format";
import { useSales } from "../../components/sales-provider";
import { DraftRequired, LiveSteps, SalesLink } from "../../components/shared";
export function LivePublishPage() {
  const { state, warehouse, run, go, directory } = useSales();
  const liveHosts = directory.filter((row) => row.role === "live-host");
  const draft = state.draft;
  if (!draft?.title || !Number.isFinite(Date.parse(draft.scheduledAt)))
    return <DraftRequired />;
  const items = draft.itemIds.flatMap((id) =>
    warehouse.items.filter((item) => item.id === id),
  );
  const prices = items.map((item) => item.price ?? 0);
  async function save(publish: boolean) {
    if (await run({ type: "save-live", publish }))
      go(`/penjualan/live?saved=${publish ? "published" : "draft"}`);
  }
  return (
    <>
      <PageHeader title="Jadwalkan live" />
      <LiveSteps step="publish" />
      <Card className="max-w-4xl">
        <DetailList
          entries={[
            { label: "Judul", value: draft.title },
            {
              label: "Jadwal",
              value: `${formatDate(draft.scheduledAt, true)} WIB · TikTok Live`,
            },
            {
              label: "Host",
              value:
                liveHosts.find((host) => host.id === draft.hostId)?.name ?? "—",
            },
            {
              label: "Kanal promosi",
              value: draft.promotionChannels.join(", "),
            },
            {
              label: "Barang",
              value: `${items.length} barang${prices.length ? ` · ${formatCurrency(Math.min(...prices))} – ${formatCurrency(Math.max(...prices))}` : ""}`,
            },
            {
              label: "Isi promosi",
              value: <p className="whitespace-pre-line">{draft.content}</p>,
            },
          ]}
        />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <SalesLink href="/penjualan/live/baru/barang">
            Kembali pilih barang
          </SalesLink>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => save(false)}>
              Simpan draf
            </Button>
            <Button onClick={() => save(true)}>Publikasikan</Button>
          </div>
        </div>
      </Card>
    </>
  );
}
