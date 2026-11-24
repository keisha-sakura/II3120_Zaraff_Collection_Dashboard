"use client";
import { PageHeader } from "@/components/layout/page-header";
import { Stepper } from "@/components/ui/stepper";
import { Card } from "@/components/ui/card";
import { DetailList } from "@/components/ui/detail-list";
import { Timeline } from "@/components/ui/timeline";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { orderStatuses, itemStatuses } from "@/config/statuses";
import { formatCurrency, formatDate } from "@/lib/format";
import { useSales } from "../../components/sales-provider";
import { MissingSalesRecord, SalesLink } from "../../components/shared";
export function OrderDetailPage({ id }: { id: string }) {
  const { state, warehouse } = useSales();
  const order = state.orders.find((order) => order.id === id);
  if (!order)
    return <MissingSalesRecord label="Pesanan" href="/penjualan/pesanan" />;
  const customer = state.customers.find(
    (customer) => customer.id === order.customerId,
  )!;
  return (
    <>
      <PageHeader title={id} />
      <Stepper
        activeId={order.status}
        label="Status pesanan"
        steps={Object.entries(orderStatuses).map(([id, value]) => ({
          id,
          label: value.label,
        }))}
      />
      <div className="mb-5 grid items-start gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-bold">Pembeli</h2>
          <DetailList
            entries={[
              {
                label: "Nama",
                value: (
                  <SalesLink href={`/penjualan/pelanggan/${customer.id}`}>
                    {customer.name}
                  </SalesLink>
                ),
              },
              { label: "Handle", value: customer.handle },
              { label: "Kontak", value: customer.phone || "Belum dilengkapi" },
              { label: "Member", value: customer.isMember ? "Aktif" : "Tidak" },
            ]}
          />
        </Card>
        <Card>
          <h2 className="mb-4 text-base font-bold">Tagihan</h2>
          <DetailList
            entries={[
              { label: "Harga barang", value: formatCurrency(order.subtotal) },
              {
                label: "Diskon member",
                value: order.memberDiscount
                  ? `−${formatCurrency(order.memberDiscount)}`
                  : "—",
              },
              {
                label: "Total",
                value: <strong>{formatCurrency(order.total)}</strong>,
              },
              {
                label: "Pembayaran",
                value: (
                  <Badge
                    tone={
                      order.paymentStatus === "approved" ? "success" : "warning"
                    }
                  >
                    {order.paymentStatus === "approved"
                      ? "Disetujui"
                      : order.paymentStatus === "pending"
                        ? "Menunggu Validasi"
                        : "Belum Dibayar"}
                  </Badge>
                ),
              },
            ]}
          />
        </Card>
      </div>
      {order.shipment && (
        <Card className="mb-5">
          <h2 className="mb-1 text-base font-bold">
            Pengiriman · {order.shipment.courier}
          </h2>
          <p className="text-primary mb-5 font-mono">
            {order.shipment.trackingNumber}
          </p>
          <Timeline
            entries={order.shipment.events.map((event, index) => ({
              id: `${id}-${index}`,
              title: event.title,
              description: event.description,
              dateTime: event.dateTime,
              formattedTime: formatDate(event.dateTime, true),
            }))}
          />
        </Card>
      )}
      <h2 className="mb-3 text-base font-bold">Barang</h2>
      <DataTable
        caption={`Barang pesanan ${id}`}
        rows={order.lines}
        rowKey={(line) => line.itemId}
        rowHref={(line) => `/gudang/inventaris/${line.itemId}`}
        columns={[
          { id: "code", header: "Kode", cell: (line) => line.itemId },
          { id: "category", header: "Kategori", cell: (line) => line.category },
          { id: "grade", header: "Grade", cell: (line) => line.grade },
          {
            id: "price",
            header: "Harga",
            cell: (line) => formatCurrency(line.price),
          },
          {
            id: "status",
            header: "Status",
            cell: (line) => {
              const item = warehouse.items.find(
                (item) => item.id === line.itemId,
              );
              return item ? (
                <Badge tone={itemStatuses[item.status].tone}>
                  {itemStatuses[item.status].label}
                </Badge>
              ) : (
                "—"
              );
            },
          },
        ]}
      />
      <div className="mt-5">
        <SalesLink href="/penjualan/pesanan">
          Kembali ke daftar pesanan
        </SalesLink>
      </div>
    </>
  );
}
