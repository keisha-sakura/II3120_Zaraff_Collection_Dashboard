"use client";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DetailList } from "@/components/ui/detail-list";
import { Timeline } from "@/components/ui/timeline";
import { Alert } from "@/components/ui/alert";
import { formatCurrency, formatDate } from "@/lib/format";
import { daysSince } from "@/features/gudang/model";
import { usePayments } from "../../components/payments-provider";
import { MissingPaymentRecord, PaymentLink } from "../../components/shared";
import { PaymentSubmission } from "../../components/payment-submission";
export function InvoiceDetailPage({ id }: { id: string }) {
  const { state, sales, run } = usePayments();
  const [requestId] = useState(() => crypto.randomUUID());
  const [sent, setSent] = useState(false);
  const invoice = state.invoices.find((invoice) => invoice.id === id);
  const order = sales.orders.find((order) => order.id === invoice?.orderId);
  if (!invoice || !order)
    return <MissingPaymentRecord label="Tagihan" href="/pembayaran/tagihan" />;
  const customer = sales.customers.find(
    (customer) => customer.id === order.customerId,
  );
  const unpaid =
    order.status === "awaiting-payment" && order.paymentStatus === "unpaid";
  const status =
    order.paymentStatus === "approved"
      ? "Lunas"
      : order.paymentStatus === "pending"
        ? "Menunggu Validasi"
        : "Belum Dibayar";
  async function remind() {
    if (await run({ type: "remind", invoiceId: id, requestId })) setSent(true);
  }
  return (
    <>
      <PageHeader
        title={id}
        description={`${customer?.handle ?? "—"} · ${order.id}`}
        primaryAction={
          unpaid && (
            <Button disabled={sent} onClick={remind}>
              Kirim pengingat
            </Button>
          )
        }
      />
      {sent && (
        <div className="mb-4">
          <Alert tone="success" title="Pengingat berhasil dicatat." />
        </div>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card>
          <DetailList
            entries={[
              {
                label: "Status",
                value: (
                  <Badge
                    tone={
                      order.paymentStatus === "approved" ? "success" : "warning"
                    }
                  >
                    {status}
                  </Badge>
                ),
              },
              {
                label: "Barang",
                value: (
                  <ul className="space-y-1">
                    {order.lines.map((line) => (
                      <li key={line.itemId}>
                        {line.itemId} · {line.category} {line.grade}
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                label: "Total tagihan",
                value: <strong>{formatCurrency(order.total)}</strong>,
              },
              {
                label: "Dibuat",
                value: `${formatDate(invoice.createdAt, true)} (${daysSince(invoice.createdAt)} hari)`,
              },
            ]}
          />
        </Card>
        <Card>
          <h2 className="mb-5 text-base font-bold">Pesan ke pembeli</h2>
          <Timeline
            entries={[...invoice.events]
              .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
              .map((event) => ({
                id: event.id,
                title: event.title,
                description: event.message,
                dateTime: event.occurredAt,
                formattedTime: `${formatDate(event.occurredAt, true)} · ${event.actor}`,
              }))}
          />
        </Card>
      </div>
      {unpaid && <PaymentSubmission orderId={order.id} total={order.total} />}
      <div className="mt-5 flex flex-wrap gap-5">
        <PaymentLink href="/pembayaran/tagihan">
          Kembali ke daftar tagihan
        </PaymentLink>
        <PaymentLink href={`/penjualan/pesanan/${order.id}`}>
          Lihat pesanan
        </PaymentLink>
      </div>
    </>
  );
}
