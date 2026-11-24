"use client";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { canAccessPage } from "@/config/pages";
import { formatDate } from "@/lib/format";
import { emptyChecklist, checklistComplete } from "../../model";
import { shippingStockIssue } from "../../operations";
import { useShipping } from "../../components/shipping-provider";
import { PackingChecklistCards } from "../../components/packing-checklist";
import {
  MissingShippingRecord,
  ShippingLink,
  paymentDate,
} from "../../components/shared";
export function PackingDetailPage({ id }: { id: string }) {
  const { state, sales, warehouse, user, run } = useShipping();
  const order = sales.orders.find((order) => order.id === id);
  if (!order) return <MissingShippingRecord />;
  const record = state.packing.find((record) => record.orderId === id);
  const checklist = record?.checklist ?? emptyChecklist();
  const customer = sales.customers.find(
    (customer) => customer.id === order.customerId,
  );
  const active = order.status === "paid" && order.paymentStatus === "approved";
  const done = ["packed", "shipped", "completed"].includes(order.status);
  const issue = active ? shippingStockIssue(order, warehouse) : null;
  const complete = checklistComplete(checklist, order.itemIds);
  const paidAt = paymentDate(order, warehouse);
  return (
    <>
      <PageHeader
        title={id}
        description={`${customer?.name ?? "—"} · ${customer?.handle ?? "—"}${paidAt ? ` · lunas ${formatDate(paidAt)}` : ""}`}
        primaryAction={
          active && (
            <Button
              disabled={!complete || !!issue}
              onClick={async () =>
                await run({ type: "mark-packed", orderId: id })
              }
            >
              Tandai dikemas
            </Button>
          )
        }
      />
      {done ? (
        <div className="mb-4">
          <Alert
            tone="success"
            title={
              order.status === "packed"
                ? "Pesanan sudah dikemas"
                : "Pesanan sudah dikirim"
            }
          >
            {record?.packedAt
              ? `Dikemas ${formatDate(record.packedAt, true)} · ${record.packedBy ?? "—"}.`
              : "Riwayat packing sudah tercatat."}
          </Alert>
        </div>
      ) : !active ? (
        <div className="mb-4">
          <Alert tone="warning" title="Pesanan belum Lunas">
            Packing hanya dapat dilakukan setelah pembayaran disetujui.
          </Alert>
        </div>
      ) : (
        issue && (
          <div className="mb-4">
            <Alert tone="warning" title="Periksa barang pesanan">
              {issue}
            </Alert>
          </div>
        )
      )}
      <PackingChecklistCards
        items={order.itemIds.flatMap((id) =>
          warehouse.items.filter((item) => item.id === id),
        )}
        checklist={checklist}
        disabled={!active || !!issue}
        onChange={async (value) =>
          await run({ type: "save-checklist", orderId: id, checklist: value })
        }
      />
      {active && !complete && (
        <p className="text-muted mt-4 text-sm">
          Lengkapi pengambilan barang, quality check, dan konfirmasi kemas
          sebelum menandai pesanan Dikemas.
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-5">
        <ShippingLink href="/pengiriman/packing">
          Kembali ke antrean packing
        </ShippingLink>
        {order.status === "packed" && canAccessPage(user.role, "D03") && (
          <ShippingLink href="/pengiriman/siap-dikirim">
            Lihat siap dikirim
          </ShippingLink>
        )}
        {canAccessPage(user.role, "P08") && (
          <ShippingLink href={`/penjualan/pesanan/${id}`}>
            Lihat pesanan
          </ShippingLink>
        )}
      </div>
    </>
  );
}
