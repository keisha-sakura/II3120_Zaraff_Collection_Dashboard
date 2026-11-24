"use client";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { shippingStatuses } from "@/config/statuses";
import { formatDate } from "@/lib/format";
import { useShipping } from "../../components/shipping-provider";
export function InTransitPage() {
  const { sales } = useShipping();
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
        ]}
        emptyMessage="Belum ada pesanan yang sedang dalam pengiriman."
      />
    </>
  );
}
