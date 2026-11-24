"use client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LiveSummary } from "../../components/live-summary";
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
  const editingPublished = state.lives.some(
    (live) => live.id === draft.editingId && live.status === "published",
  );
  async function save(publish: boolean) {
    const id = await run({ type: "save-live", publish });
    if (id)
      go(publish ? `/penjualan/live/${id}` : "/penjualan/live?saved=draft");
  }
  return (
    <>
      <PageHeader title="Jadwalkan live" />
      <LiveSteps step="publish" />
      <Card className="max-w-4xl">
        <LiveSummary
          live={draft}
          items={items}
          hostName={
            liveHosts.find((host) => host.id === draft.hostId)?.name ??
            draft.hostId
          }
        />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <SalesLink href="/penjualan/live/baru/barang">
            Kembali pilih barang
          </SalesLink>
          <div className="flex gap-3">
            {!editingPublished && (
              <Button variant="secondary" onClick={() => save(false)}>
                Simpan draf
              </Button>
            )}
            <Button onClick={() => save(true)}>
              {editingPublished ? "Simpan perubahan" : "Publikasikan"}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
