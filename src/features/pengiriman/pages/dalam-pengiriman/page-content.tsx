"use client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField, Input, Select } from "@/components/ui/form-field";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { shippingStatuses } from "@/config/statuses";
import { formatDate } from "@/lib/format";
import { useShipping } from "../../components/shipping-provider";
export function InTransitPage() {
  const { sales, run } = useShipping();
  const [selected, setSelected] = useState<string | null>(null);
  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const values = new FormData(event.currentTarget);
    const saved = await run({
      type: "update-tracking",
      orderId: selected,
      status: values.get("status") as "in-transit" | "delivered",
      description: String(values.get("description")),
    });
    if (saved) setSelected(null);
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
      <PageHeader title="Dalam pengiriman" />
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
            cell: (row) => (
              <Button
                variant="secondary"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setSelected(row.order.id);
                }}
              >
                Perbarui status
              </Button>
            ),
          },
        ]}
        emptyMessage="Belum ada pesanan yang sedang dalam pengiriman."
      />
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Perbarui status pengiriman"
      >
        {selected && (
          <form onSubmit={update} className="space-y-4">
            <p className="text-muted text-sm">
              {selected} · Catat konfirmasi dari kurir atau penerima.
            </p>
            <FormField id="tracking-status" label="Status">
              <Select
                id="tracking-status"
                name="status"
                defaultValue="in-transit"
              >
                <option value="in-transit">Dalam pengiriman</option>
                <option value="delivered">Diterima pembeli</option>
              </Select>
            </FormField>
            <FormField id="tracking-description" label="Keterangan">
              <Input
                id="tracking-description"
                name="description"
                required
                minLength={3}
                maxLength={500}
              />
            </FormField>
            <Button type="submit">Simpan status</Button>
          </form>
        )}
      </Dialog>
    </>
  );
}
