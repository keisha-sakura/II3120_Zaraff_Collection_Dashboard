"use client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailList } from "@/components/ui/detail-list";
import { Timeline } from "@/components/ui/timeline";
import { formatDate } from "@/lib/format";
import { useWarehouse } from "../../components/warehouse-provider";
import {
  BaleStatusBadge,
  CancelLink,
  Location,
  MissingRecord,
} from "../../components/shared";
export function BaleDetailPage({ id }: { id: string }) {
  const { state, run, go } = useWarehouse();
  const bale = state.bales.find((bale) => bale.id === id);
  if (!bale) return <MissingRecord kind="Bale" href="/gudang/bale" />;
  function start() {
    if (bale!.status === "sorting" || run({ type: "start-sort", baleId: id }))
      go(`/gudang/bale/${id}/sortir`);
  }
  const history = state.movements
    .filter((movement) => movement.entityId === id)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return (
    <>
      <PageHeader
        title={id}
        primaryAction={
          bale.status !== "sorted" && (
            <Button onClick={start}>
              {bale.status === "stored" ? "Mulai sortir" : "Lanjut sortir"}
            </Button>
          )
        }
      />
      <div className="grid items-start gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <DetailList
            entries={[
              {
                label: "Status",
                value: <BaleStatusBadge status={bale.status} />,
              },
              { label: "Supplier", value: bale.supplier },
              { label: "Jenis", value: bale.category },
              { label: "Berat", value: `${bale.weightKg} kg` },
              { label: "Perkiraan item", value: bale.estimatedItems },
              {
                label: "Diterima",
                value: `${formatDate(bale.receivedAt, true)} · ${bale.receivedBy}`,
              },
              { label: "Lokasi", value: <Location code={bale.locationId} /> },
            ]}
          />
        </Card>
        <Card>
          <h2 className="mb-5 text-base font-bold">Riwayat</h2>
          <Timeline
            entries={history.map((movement) => ({
              id: movement.id,
              title: movement.action,
              description: movement.to === "—" ? movement.from : movement.to,
              dateTime: movement.occurredAt,
              formattedTime: `${formatDate(movement.occurredAt, true)} · ${movement.actor}`,
            }))}
          />
        </Card>
      </div>
      <div className="mt-5">
        <CancelLink href="/gudang/bale">Kembali ke daftar bale</CancelLink>
      </div>
    </>
  );
}
