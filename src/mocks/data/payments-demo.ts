import type { SalesState } from "@/features/penjualan/model";
import type { WarehouseState } from "@/features/gudang/model";
import type { PaymentAttempt } from "@/features/pembayaran/model";
import { ensureInvoices } from "../../features/pembayaran/invoices.ts";
export { ensureInvoices } from "../../features/pembayaran/invoices.ts";

/** Fresh demos show the pending-deposit artboard. Migration never rewinds saved balances. */
export function createPaymentsDemo(
  salesSource: SalesState,
  warehouseSource: WarehouseState,
  prepareDepositExample = false,
) {
  const sales = structuredClone(salesSource);
  const warehouse = structuredClone(warehouseSource);
  const fajarOrder = sales.orders.find(
    (order) => order.id === "ORD-261121-002",
  );
  const fajar = sales.customers.find(
    (customer) => customer.id === fajarOrder?.customerId,
  );
  if (prepareDepositExample && fajarOrder?.status === "paid" && fajar) {
    const debit = sales.deposits.find(
      (entry) =>
        entry.customerId === fajar.id &&
        entry.description === fajarOrder.id &&
        entry.amount === -fajarOrder.total,
    );
    if (debit) {
      sales.deposits = sales.deposits.filter((entry) => entry.id !== debit.id);
      fajar.depositBalance -= debit.amount;
      fajarOrder.status = "awaiting-payment";
      fajarOrder.paymentStatus = "pending";
      for (const item of warehouse.items.filter((item) =>
        fajarOrder.itemIds.includes(item.id),
      )) {
        item.status = "reserved";
        item.soldAt = null;
        item.orderId = fajarOrder.id;
      }
    }
  }
  const attempts: PaymentAttempt[] = sales.orders
    .filter((order) => order.paymentStatus !== "unpaid")
    .map((order) => {
      const sari = order.id === "ORD-261121-003";
      const deposit = order.id === "ORD-261121-002";
      const customer = sales.customers.find(
        (customer) => customer.id === order.customerId,
      );
      const approved = order.paymentStatus === "approved";
      const amount = sari && !approved ? 48500 : order.total;
      const submittedAt = sari
        ? "2026-11-23T11:20:00+07:00"
        : deposit
          ? "2026-11-23T08:00:00+07:00"
          : order.createdAt;
      return {
        id: sari
          ? "payment-sari"
          : deposit
            ? "payment-fajar"
            : `payment-${order.id}`,
        orderId: order.id,
        method: deposit ? "deposit" : "transfer",
        amount,
        submittedAt,
        status: approved ? "approved" : "pending",
        proof: deposit
          ? null
          : {
              fileName: sari
                ? "bukti_tf_sarivintage.jpg"
                : `bukti_${order.id}.jpg`,
              amount,
            },
        reviewedAt: approved ? submittedAt : null,
        reviewedBy: approved ? "Keisha" : null,
        rejectionReason: null,
        balanceBefore:
          deposit && approved
            ? (customer?.depositBalance ?? 0) + order.total
            : null,
        balanceAfter:
          deposit && approved ? (customer?.depositBalance ?? 0) : null,
      };
    });
  const payments = ensureInvoices(
    { version: 1, attempts, invoices: [] },
    sales,
  );
  const mega = payments.invoices.find(
    (invoice) => invoice.orderId === "ORD-261121-004",
  );
  if (mega)
    mega.events.unshift({
      id: "seed-reminder-mega",
      type: "reminder",
      title: "Pengingat pembayaran",
      message: "Pengingat tagihan Rp 45.000.",
      occurredAt: "2026-11-23T10:00:00+07:00",
      actor: "Keisha",
    });
  return { sales, warehouse, payments };
}
