"use client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { DetailList } from "@/components/ui/detail-list";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { shippingStatuses } from "@/config/statuses";
import { formatDate } from "@/lib/format";
import { useShipping } from "../../components/shipping-provider";
import { ShippingLink } from "../../components/shared";
export function InTransitPage() {
  const { sales, run, error } = useShipping();
  const [selected, setSelected] = useState<string | null>(null);
  const [received, setReceived] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedOrder = sales.orders.find((order) => order.id === selected);
  function open(orderId: string) {
    setSelected(orderId);
    setReceived(false);
    setAttempted(false);
    setNotice(null);
  }
  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || busy || !received) return;
    setBusy(true);
    setAttempted(true);
    try {
      const saved = await run({
        type: "update-tracking",
        orderId: selected,
        status: "delivered",
        description: "Paket telah diterima pembeli, dikonfirmasi oleh petugas.",
      });
      if (saved) {
        setNotice(saved);
        setSelected(null);
      }
    } finally {
      setBusy(false);
    }
  }
  const rows = sales.orders
    .flatMap((order) =>
      order.status === "shipped" &&
      order.shipment &&
      order.shipment.status !== "delivered"
        ? [{ order, shipment: order.shipment }]
        : [],
    )
    .sort((a, b) =>
      b.shipment.handedOverAt.localeCompare(a.shipment.handedOverAt),
    );
  return (
    <>
      <PageHeader
        title="Dalam pengiriman"
        description="Paket sudah sampai? Konfirmasi penerimaan untuk menyelesaikan pesanan."
      />
      {notice && (
        <div className="mb-4">
          <Alert tone="success" title={`Pesanan ${notice} selesai`}>
            <p>
              Paket dikonfirmasi diterima pembeli dan dikeluarkan dari daftar
              pengiriman aktif.
            </p>
            <div className="mt-2">
              <ShippingLink href={`/penjualan/pesanan/${notice}`}>
                Lihat detail pesanan
              </ShippingLink>
            </div>
          </Alert>
        </div>
      )}
      <DataTable
        caption="Pesanan dalam pengiriman; pilih baris untuk riwayat pesanan"
        rows={rows}
        rowKey={(row) => row.order.id}
        rowHref={(row) => `/penjualan/pesanan/${row.order.id}`}
        columns={[
          {
            id: "order",
            header: "Pesanan",
            cell: (row) => (
              <span className="font-semibold whitespace-nowrap">
                {row.order.id}
              </span>
            ),
          },
          {
            id: "buyer",
            header: "Pembeli",
            cell: (row) =>
              sales.customers.find(
                (customer) => customer.id === row.order.customerId,
              )?.handle ?? "—",
          },
          {
            id: "courier",
            header: "Kurir",
            cell: (row) => row.shipment.courier,
          },
          {
            id: "tracking",
            header: "Nomor resi",
            cell: (row) => (
              <span className="font-mono whitespace-nowrap">
                {row.shipment.trackingNumber}
              </span>
            ),
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <Badge tone={shippingStatuses[row.shipment.status].tone}>
                {shippingStatuses[row.shipment.status].label}
              </Badge>
            ),
          },
          {
            id: "updated",
            header: "Update terakhir",
            cell: (row) => {
              const event = [...row.shipment.events].sort((a, b) =>
                b.dateTime.localeCompare(a.dateTime),
              )[0];
              return formatDate(
                event?.dateTime ?? row.shipment.handedOverAt,
                true,
              );
            },
          },
          {
            id: "action",
            header: "Tindakan",
            interactive: true,
            cell: (row) => (
              <Button
                variant="secondary"
                aria-label={`Konfirmasi penerimaan ${row.order.id}`}
                onClick={() => open(row.order.id)}
              >
                Konfirmasi penerimaan
              </Button>
            ),
          },
        ]}
        emptyMessage="Belum ada pesanan yang sedang dalam pengiriman."
      />
      <Dialog
        open={Boolean(selected)}
        onClose={() => {
          if (!busy) setSelected(null);
        }}
        title="Konfirmasi penerimaan"
      >
        {selected && selectedOrder?.shipment && (
          <form onSubmit={update} className="space-y-4">
            <DetailList
              entries={[
                { label: "Pesanan", value: selectedOrder.id },
                {
                  label: "Pembeli",
                  value:
                    sales.customers.find(
                      (customer) => customer.id === selectedOrder.customerId,
                    )?.handle ?? "—",
                },
                { label: "Kurir", value: selectedOrder.shipment.courier },
                {
                  label: "Nomor resi",
                  value: selectedOrder.shipment.trackingNumber,
                },
              ]}
            />
            <p className="text-muted text-sm">
              Pastikan paket sudah diterima pembeli. Konfirmasi ini akan
              mengubah status pesanan menjadi Selesai.
            </p>
            <Checkbox
              name="received"
              label="Paket sudah diterima pembeli"
              checked={received}
              onChange={(event) => setReceived(event.target.checked)}
              required
              disabled={busy}
            />
            {attempted && error && !busy && (
              <Alert tone="danger" title="Perubahan belum tersimpan">
                {error}
              </Alert>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <Button type="submit" disabled={busy || !received}>
                {busy ? "Menyimpan…" : "Ya, selesaikan pesanan"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
