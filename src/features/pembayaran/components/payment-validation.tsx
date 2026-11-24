"use client";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Dialog } from "@/components/ui/dialog";
import { FormField, Textarea } from "@/components/ui/form-field";
import { formatCurrency, formatDate } from "@/lib/format";
import { paymentStatuses } from "@/config/statuses";
import { approvalIssue } from "../operations";
import { usePayments } from "./payments-provider";
import { BillSummary, MissingPaymentRecord, PaymentLink } from "./shared";
export function PaymentValidation({
  id,
  method,
}: {
  id: string;
  method: "transfer" | "deposit";
}) {
  const { state, sales, warehouse, run, error } = usePayments();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const attempt = state.attempts.find(
    (attempt) => attempt.id === id && attempt.method === method,
  );
  if (!attempt) return <MissingPaymentRecord label="Pembayaran" />;
  const order = sales.orders.find((order) => order.id === attempt.orderId);
  const invoice = state.invoices.find(
    (invoice) => invoice.orderId === attempt.orderId,
  );
  if (!order || !invoice) return <MissingPaymentRecord label="Tagihan" />;
  const customer = sales.customers.find(
    (customer) => customer.id === order.customerId,
  );
  const pending = attempt.status === "pending";
  const issue = pending ? approvalIssue(attempt, sales, warehouse) : null;
  const mismatch =
    method === "transfer" &&
    (attempt.amount !== order.total || attempt.proof?.amount !== order.total);
  async function reject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await run({ type: "reject", paymentId: id, reason })) setOpen(false);
  }
  return (
    <>
      <PageHeader
        title={`Validasi ${order.id}`}
        description={`${customer?.handle ?? "—"}${customer?.isMember ? " · Member" : ""} · ${formatDate(attempt.submittedAt, true)}`}
        primaryAction={
          pending && (
            <Button
              disabled={!!issue}
              title={issue ?? undefined}
              onClick={async () =>
                await run({ type: "approve", paymentId: id })
              }
            >
              Setujui pembayaran
            </Button>
          )
        }
        secondaryAction={
          pending && (
            <Button variant="danger" onClick={() => setOpen(true)}>
              Tolak
            </Button>
          )
        }
      />
      {!pending && (
        <div className="mb-4">
          <Alert
            tone={attempt.status === "approved" ? "success" : "danger"}
            title={
              attempt.status === "approved"
                ? "Pembayaran disetujui"
                : "Pembayaran ditolak"
            }
          >
            {attempt.rejectionReason ??
              `Pesanan menjadi Lunas. Ditinjau oleh ${attempt.reviewedBy ?? "—"}${attempt.reviewedAt ? ` · ${formatDate(attempt.reviewedAt, true)}` : ""}.`}
          </Alert>
        </div>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <BillSummary
          order={order}
          invoiceId={invoice.id}
          method={method === "transfer" ? "Transfer" : "Saldo deposit"}
        />
        <Card>
          {method === "transfer" ? (
            <>
              <h2 className="mb-4 text-base font-bold">
                Bukti transfer: {attempt.proof?.fileName ?? "Belum tersedia"}
                {attempt.proof?.uploadId && (
                  <a
                    href={`/api/uploads/${attempt.proof.uploadId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary ml-2 font-semibold hover:underline"
                  >
                    Lihat bukti
                  </a>
                )}
              </h2>
              <div className="border-border bg-sidebar rounded-control mb-4 grid min-h-52 place-content-center gap-3 border border-dashed p-6 text-center">
                <span className="text-muted text-xs">
                  Contoh bukti transfer
                </span>
                <p className="text-3xl font-extrabold">
                  {formatCurrency(attempt.proof?.amount ?? attempt.amount)}
                </p>
                <span className="text-muted text-sm">{customer?.handle}</span>
              </div>
              {mismatch && (
                <Alert tone="danger" title="Nominal tidak sesuai">
                  Total tagihan {formatCurrency(order.total)}, sedangkan bukti
                  transfer menunjukkan{" "}
                  {formatCurrency(attempt.proof?.amount ?? attempt.amount)}.
                </Alert>
              )}
            </>
          ) : (
            <>
              <h2 className="mb-3 text-base font-bold">
                Bayar dari saldo deposit
              </h2>
              <p className="mb-4 text-3xl font-extrabold">
                {formatCurrency(
                  pending
                    ? (customer?.depositBalance ?? 0)
                    : (attempt.balanceBefore ?? customer?.depositBalance ?? 0),
                )}
              </p>
              {attempt.status === "approved" ? (
                <Alert tone="success" title="Pembayaran sukses">
                  Sisa saldo{" "}
                  {formatCurrency(
                    attempt.balanceAfter ?? customer?.depositBalance ?? 0,
                  )}{" "}
                  setelah dipotong pembayaran.
                </Alert>
              ) : (
                pending && (
                  <p className="text-muted text-sm">
                    {(customer?.depositBalance ?? 0) >= order.total
                      ? `Sisa saldo setelah disetujui: ${formatCurrency((customer?.depositBalance ?? 0) - order.total)}.`
                      : "Saldo belum mencukupi untuk membayar tagihan."}
                  </p>
                )
              )}
            </>
          )}
          {pending && issue && !mismatch && (
            <div className="mt-4">
              <Alert tone="warning" title="Pembayaran belum dapat disetujui">
                {issue}
              </Alert>
            </div>
          )}
          <div className="mt-5">
            <Badge tone={paymentStatuses[attempt.status].tone}>
              {paymentStatuses[attempt.status].label}
            </Badge>
          </div>
        </Card>
      </div>
      <div className="mt-5 flex flex-wrap gap-5">
        <PaymentLink href="/pembayaran/validasi">
          Kembali ke menunggu validasi
        </PaymentLink>
        <PaymentLink href={`/penjualan/pesanan/${order.id}`}>
          Lihat pesanan
        </PaymentLink>
        <PaymentLink href={`/pembayaran/tagihan/${invoice.id}`}>
          Lihat tagihan
        </PaymentLink>
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Tolak pembayaran"
      >
        <form onSubmit={reject} className="space-y-5">
          <FormField
            id="payment-rejection"
            label="Alasan penolakan"
            error={error ?? undefined}
          >
            <Textarea
              id="payment-rejection"
              aria-describedby={error ? "payment-rejection-error" : undefined}
              aria-invalid={!!error}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              minLength={3}
              maxLength={500}
              placeholder="Contoh: Nominal transfer kurang dari total tagihan"
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button variant="text" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="danger">
              Tolak pembayaran
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
