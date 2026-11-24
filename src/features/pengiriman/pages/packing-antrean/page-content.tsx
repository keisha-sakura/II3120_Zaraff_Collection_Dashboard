"use client";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { LocationBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { useShipping } from "../../components/shipping-provider";
import { paymentDate } from "../../components/shared";
export function PackingQueuePage() {
  const { sales, warehouse } = useShipping();
  const rows = sales.orders.filter(
    (order) => order.status === "paid" && order.paymentStatus === "approved",
  );
  return (
    <>
      <PageHeader title="Antrean Packing" />
      <DataTable
        caption="Pesanan Lunas menunggu packing"
        rows={rows}
        rowKey={(order) => order.id}
        rowHref={(order) => `/pengiriman/packing/${order.id}`}
        columns={[
          {
            id: "order",
            header: "Pesanan",
            cell: (order) => (
              <span className="font-semibold whitespace-nowrap">
                {order.id}
              </span>
            ),
          },
          {
            id: "customer",
            header: "Pembeli",
            cell: (order) =>
              sales.customers.find(
                (customer) => customer.id === order.customerId,
              )?.name ?? "—",
          },
          {
            id: "items",
            header: "Barang",
            cell: (order) => (
              <ul className="space-y-1">
                {order.itemIds.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            ),
          },
          {
            id: "location",
            header: "Lokasi rak",
            cell: (order) => (
              <div className="flex flex-wrap gap-1">
                {[
                  ...new Set(
                    order.itemIds.map(
                      (id) =>
                        warehouse.items.find((item) => item.id === id)
                          ?.locationId,
                    ),
                  ),
                ].map((location, index) =>
                  location ? (
                    <LocationBadge key={location}>{location}</LocationBadge>
                  ) : (
                    <span key={`missing-${index}`}>—</span>
                  ),
                )}
              </div>
            ),
          },
          {
            id: "paid",
            header: "Lunas",
            cell: (order) => {
              const date = paymentDate(order, warehouse);
              return date ? formatDate(date, true) : "—";
            },
          },
        ]}
        emptyMessage="Tidak ada pesanan Lunas yang menunggu packing."
      />
    </>
  );
}
