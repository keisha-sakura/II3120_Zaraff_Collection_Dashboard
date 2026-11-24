import type { WarehouseState } from "@/features/gudang/model";
import type { SalesState } from "@/features/penjualan/model";
import type { PaymentsState, PaymentCommand, PaymentAttempt } from "./model";
import { ensureInvoices } from "../../mocks/data/payments-demo.ts";

function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function approvalIssue(
  attempt: PaymentAttempt,
  sales: SalesState,
  warehouse: WarehouseState,
): string | null {
  const order = sales.orders.find((order) => order.id === attempt.orderId);
  if (!order) return "Pesanan tidak ditemukan.";
  if (
    attempt.status !== "pending" ||
    order.status !== "awaiting-payment" ||
    order.paymentStatus !== "pending"
  )
    return "Pembayaran ini sudah ditinjau atau pesanan sudah dibayar.";
  if (
    !Number.isInteger(attempt.amount) ||
    attempt.amount <= 0 ||
    attempt.amount !== order.total
  )
    return "Nominal pembayaran tidak sesuai total tagihan.";
  if (
    attempt.method === "transfer" &&
    (!attempt.proof || attempt.proof.amount !== order.total)
  )
    return "Nominal pada bukti transfer tidak sesuai total tagihan.";
  const customer = sales.customers.find(
    (customer) => customer.id === order.customerId,
  );
  if (!customer) return "Pelanggan tidak ditemukan.";
  if (
    attempt.method === "deposit" &&
    (!Number.isFinite(customer.depositBalance) ||
      customer.depositBalance < order.total)
  )
    return "Saldo deposit tidak mencukupi.";
  if (
    !order.itemIds.length ||
    !order.itemIds.every((id) =>
      warehouse.items.some(
        (item) =>
          item.id === id &&
          item.status === "reserved" &&
          item.orderId === order.id,
      ),
    )
  )
    return "Reservasi barang sudah berubah. Periksa pesanan dan stok terlebih dahulu.";
  return null;
}

export function applyPaymentCommand(
  source: PaymentsState,
  salesSource: SalesState,
  warehouseSource: WarehouseState,
  command: PaymentCommand,
  actor: string,
  now: string,
) {
  check(Number.isFinite(Date.parse(now)), "Waktu aktivitas tidak valid.");
  const payments = ensureInvoices(source, salesSource);
  const sales = structuredClone(salesSource);
  const warehouse = structuredClone(warehouseSource);
  if (command.type === "remind") {
    const invoice = payments.invoices.find(
      (invoice) => invoice.id === command.invoiceId,
    );
    check(invoice, "Tagihan tidak ditemukan.");
    const order = sales.orders.find((order) => order.id === invoice.orderId);
    check(
      order &&
        order.status === "awaiting-payment" &&
        order.paymentStatus === "unpaid",
      "Pengingat hanya tersedia untuk tagihan yang belum dibayar dan tidak sedang divalidasi.",
    );
    check(
      command.requestId.trim().length >= 6 && command.requestId.length <= 100,
      "Permintaan pengingat tidak valid.",
    );
    const id = `${invoice.id}:remind:${command.requestId}`;
    if (!invoice.events.some((event) => event.id === id))
      invoice.events.unshift({
        id,
        type: "reminder",
        title: "Pengingat pembayaran",
        message: `Pengingat tagihan ${invoice.id} sebesar Rp ${order.total.toLocaleString("id-ID")} tercatat dalam demo.`,
        occurredAt: now,
        actor,
      });
    return { payments, sales, warehouse, entityId: invoice.id };
  }
  const attempt = payments.attempts.find(
    (attempt) => attempt.id === command.paymentId,
  );
  check(attempt, "Pembayaran tidak ditemukan.");
  const order = sales.orders.find((order) => order.id === attempt.orderId);
  check(order, "Pesanan tidak ditemukan.");
  check(
    attempt.status === "pending" &&
      order.status === "awaiting-payment" &&
      order.paymentStatus === "pending",
    "Pembayaran ini sudah ditinjau atau pesanan sudah dibayar.",
  );
  check(
    !payments.attempts.some(
      (other) => other.orderId === order.id && other.status === "approved",
    ),
    "Pesanan ini sudah memiliki pembayaran yang disetujui.",
  );
  const invoice = payments.invoices.find(
    (invoice) => invoice.orderId === order.id,
  )!;
  if (command.type === "reject") {
    check(
      command.reason.trim().length >= 3 && command.reason.trim().length <= 500,
      "Alasan penolakan wajib diisi (3–500 karakter).",
    );
    attempt.status = "rejected";
    attempt.rejectionReason = command.reason.trim();
    order.paymentStatus = "unpaid";
    invoice.events.unshift({
      id: `rejected-${attempt.id}`,
      type: "rejected",
      title: "Pembayaran ditolak",
      message: attempt.rejectionReason,
      occurredAt: now,
      actor,
    });
  } else {
    const issue = approvalIssue(attempt, sales, warehouse);
    check(!issue, issue ?? "Pembayaran belum dapat disetujui.");
    const customer = sales.customers.find(
      (customer) => customer.id === order.customerId,
    )!;
    if (attempt.method === "deposit") {
      const entryId = `payment-debit-${attempt.id}`;
      check(
        !sales.deposits.some((entry) => entry.id === entryId),
        "Saldo untuk pembayaran ini sudah dipotong.",
      );
      attempt.balanceBefore = customer.depositBalance;
      customer.depositBalance -= order.total;
      attempt.balanceAfter = customer.depositBalance;
      sales.deposits.unshift({
        id: entryId,
        customerId: customer.id,
        occurredAt: now,
        description: order.id,
        amount: -order.total,
      });
    }
    attempt.status = "approved";
    order.status = "paid";
    order.paymentStatus = "approved";
    for (const id of order.itemIds) {
      const item = warehouse.items.find((item) => item.id === id)!;
      item.status = "sold";
      item.soldAt = now;
      warehouse.movements.unshift({
        id: `paid-${attempt.id}-${id}`,
        entityId: id,
        occurredAt: now,
        action: "Pembayaran disetujui",
        from: "Dipesan",
        to: "Terjual",
        actor,
      });
    }
    invoice.events.unshift({
      id: `approved-${attempt.id}`,
      type: "approved",
      title: "Konfirmasi pembayaran",
      message: `Pembayaran Rp ${order.total.toLocaleString("id-ID")} diterima. Pesanan menjadi Lunas.`,
      occurredAt: now,
      actor,
    });
  }
  attempt.reviewedAt = now;
  attempt.reviewedBy = actor;
  return { payments, sales, warehouse, entityId: attempt.id };
}
