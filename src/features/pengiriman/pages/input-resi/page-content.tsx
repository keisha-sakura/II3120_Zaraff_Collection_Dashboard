"use client";
import type { FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FormField, Input, Select, Checkbox } from "@/components/ui/form-field";
import { couriers } from "../../model";
import { shippingStockIssue } from "../../operations";
import { useShipping } from "../../components/shipping-provider";
import { MissingShippingRecord, ShippingLink } from "../../components/shared";
export function TrackingInputPage({ id }: { id: string }) {
  const { sales, warehouse, run, go } = useShipping();
  const order = sales.orders.find((order) => order.id === id);
  if (!order) return <MissingShippingRecord />;
  if (order.shipment)
    return (
      <>
        <PageHeader title={`Kirim ${id}`} />
        <Alert tone="success" title="Resi pesanan sudah tersimpan">
          {order.shipment.courier} · {order.shipment.trackingNumber}
        </Alert>
        <div className="mt-5">
          <ShippingLink href="/pengiriman/dalam-pengiriman">
            Lihat dalam pengiriman
          </ShippingLink>
        </div>
      </>
    );
  if (order.status !== "packed" || order.paymentStatus !== "approved")
    return (
      <>
        <PageHeader title={`Kirim ${id}`} />
        <Alert tone="warning" title="Pesanan belum siap dikirim">
          Pesanan harus Lunas dan selesai Dikemas terlebih dahulu.
        </Alert>
        <div className="mt-5">
          <ShippingLink href={`/pengiriman/packing/${id}`}>
            Lihat detail packing
          </ShippingLink>
        </div>
      </>
    );
  const customer = sales.customers.find(
    (customer) => customer.id === order.customerId,
  );
  const issue = shippingStockIssue(order, warehouse);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    if (
      run({
        type: "dispatch",
        orderId: id,
        courier: String(values.get("courier")),
        trackingNumber: String(values.get("tracking")),
        handedOver: values.get("handedOver") === "on",
      })
    )
      go("/pengiriman/dalam-pengiriman");
  }
  return (
    <>
      <PageHeader
        title={`Kirim ${id}`}
        description={`${customer?.handle ?? "—"} · ${order.itemIds.join(", ")}`}
      />
      {issue && (
        <div className="mb-4">
          <Alert tone="warning" title="Periksa barang pesanan">
            {issue}
          </Alert>
        </div>
      )}
      <Card className="max-w-3xl">
        <form onSubmit={submit} className="space-y-5">
          <FormField id="shipment-courier" label="Kurir">
            <Select
              id="shipment-courier"
              name="courier"
              defaultValue={couriers[0]}
            >
              {couriers.map((courier) => (
                <option key={courier}>{courier}</option>
              ))}
            </Select>
          </FormField>
          <FormField id="shipment-tracking" label="Nomor resi">
            <Input
              id="shipment-tracking"
              name="tracking"
              required
              minLength={5}
              maxLength={64}
              pattern="[A-Za-z0-9][A-Za-z0-9\-]{4,63}"
              placeholder="Contoh: JP7714102238"
            />
          </FormField>
          <Checkbox
            label="Paket sudah diserahkan ke kurir"
            name="handedOver"
            required
          />
          <div className="flex flex-wrap items-center justify-end gap-4">
            <ShippingLink href="/pengiriman/siap-dikirim">Batal</ShippingLink>
            <Button type="submit" disabled={!!issue}>
              Simpan resi
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
