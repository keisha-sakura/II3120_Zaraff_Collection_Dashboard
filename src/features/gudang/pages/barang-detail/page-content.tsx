"use client";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DetailList } from "@/components/ui/detail-list";
import { Dialog } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { FormField, Select } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { formatCurrency, formatDate } from "@/lib/format";
import { daysSince } from "../../model";
import { useWarehouse } from "../../components/warehouse-provider";
import {
  CancelLink,
  ItemStatusBadge,
  Location,
  MissingRecord,
} from "../../components/shared";
export function ItemDetailPage({ id }: { id: string }) {
  const { state, run } = useWarehouse();
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const item = state.items.find((item) => item.id === id);
  if (!item) return <MissingRecord kind="Barang" href="/gudang/inventaris" />;
  const movable =
    ["available", "reserved", "sold"].includes(item.status) &&
    !!item.locationId;
  const history = state.movements
    .filter((movement) => movement.entityId === id)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  async function move(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (
      await run({
        type: "move",
        itemId: id,
        locationId: String(data.get("location")),
      })
    ) {
      setOpen(false);
      setSuccess(true);
    }
  }
  return (
    <>
      <PageHeader
        title={id}
        description={`${item.category} · grade ${item.grade ?? "—"} · ${item.price === null ? "Harga belum ditentukan" : formatCurrency(item.price)}`}
        primaryAction={
          movable && (
            <Button onClick={() => setOpen(true)}>Pindah lokasi</Button>
          )
        }
      />
      {success && (
        <div className="mb-4">
          <Alert tone="success" title="Lokasi barang berhasil dipindahkan." />
        </div>
      )}
      <Card className="mb-5">
        <DetailList
          entries={[
            {
              label: "Status",
              value: <ItemStatusBadge status={item.status} />,
            },
            { label: "Lokasi", value: <Location code={item.locationId} /> },
            { label: "Kondisi", value: item.condition },
            {
              label: "Bale",
              value: (
                <CancelLink href={`/gudang/bale/${item.baleId}`}>
                  {item.baleId}
                </CancelLink>
              ),
            },
            { label: "Pesanan", value: item.orderId ?? "—" },
            {
              label: "Tersedia sejak",
              value: item.availableAt
                ? `${formatDate(item.availableAt)} (${daysSince(item.availableAt)} hari)`
                : "—",
            },
            {
              label: "Terjual",
              value: item.soldAt ? formatDate(item.soldAt) : "—",
            },
            {
              label: "Keluar gudang",
              value: item.outboundAt ? formatDate(item.outboundAt) : "—",
            },
          ]}
        />
      </Card>
      <h2 className="mb-3 text-base font-bold">Riwayat pergerakan</h2>
      <DataTable
        caption={`Riwayat pergerakan ${id}`}
        rows={history}
        rowKey={(movement) => movement.id}
        columns={[
          {
            id: "time",
            header: "Waktu",
            cell: (movement) => formatDate(movement.occurredAt, true),
          },
          {
            id: "action",
            header: "Perubahan",
            cell: (movement) => movement.action,
          },
          { id: "from", header: "Dari", cell: (movement) => movement.from },
          { id: "to", header: "Ke", cell: (movement) => movement.to },
          { id: "actor", header: "Oleh", cell: (movement) => movement.actor },
        ]}
        emptyMessage="Belum ada riwayat pergerakan."
      />
      <div className="mt-5">
        <CancelLink href="/gudang/inventaris">Kembali ke inventaris</CancelLink>
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Pindah lokasi ${id}`}
      >
        <p className="mb-5 text-sm">
          Lokasi sekarang <Location code={item.locationId} />
        </p>
        <form onSubmit={move} className="space-y-5">
          <FormField id="move-location" label="Lokasi tujuan">
            <Select id="move-location" name="location" required defaultValue="">
              <option value="" disabled>
                Pilih lokasi tujuan
              </option>
              {state.locations
                .filter(
                  (location) =>
                    location.kind === "rack" && location.id !== item.locationId,
                )
                .map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.code} · {location.description}
                  </option>
                ))}
            </Select>
          </FormField>
          <div className="flex justify-end gap-3">
            <Button variant="text" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Pindahkan</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
