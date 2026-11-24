"use client";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/format";
import { useShipping } from "../../components/shipping-provider";
export function ReadyToShipPage() {
  const { state, sales } = useShipping();
  return (
    <>
      <PageHeader title="Siap dikirim" />
      <DataTable
        caption="Pesanan Dikemas siap diserahkan ke kurir"
        rows={sales.orders.filter(
          (order) =>
            order.status === "packed" && order.paymentStatus === "approved",
        )}
        rowKey={(order) => order.id}
        rowHref={(order) => `/pengiriman/siap-dikirim/${order.id}/resi`}
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
            id: "buyer",
            header: "Pembeli",
            cell: (order) =>
              sales.customers.find(
                (customer) => customer.id === order.customerId,
              )?.handle ?? "—",
          },
          {
            id: "items",
            header: "Barang",
            cell: (order) => order.itemIds.join(", "),
          },
          {
            id: "packed",
            header: "Dikemas",
            cell: (order) => {
              const record = state.packing.find(
                (record) => record.orderId === order.id,
              );
              return record?.packedAt
                ? `${formatDate(record.packedAt, true)} · ${record.packedBy ?? "—"}`
                : "—";
            },
          },
        ]}
        emptyMessage="Belum ada pesanan yang selesai dikemas."
      />
    </>
  );
}
