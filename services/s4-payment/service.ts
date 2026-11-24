// S4 Payment — entity service.
// Aturan SOA: service ini tidak boleh mengimpor service task manapun.
// Semua orkestrasi lintas service ada di S12 Order Fulfillment.

import { type DbTransaction } from "@backend/lib/db";
import { errors } from "@backend/lib/errors";
import { catatStatus } from "@backend/services/audit/service";
import { invoiceRepository, paymentRepository } from "./repository";

export const paymentService = {
  // ── Invoice ──────────────────────────────────────────────────────────────

  async createInvoice(
    data: { orderId: string; subtotal: number; diskon: number; jumlah: number },
    tx?: DbTransaction,
  ) {
    const existing = await invoiceRepository.findByOrderId(data.orderId, tx);
    if (existing) throw errors.konflik("Tagihan untuk pesanan ini sudah ada");
    return invoiceRepository.create({ ...data, status: "belum dibayar" }, tx);
  },

  async findInvoiceById(id: string, tx?: DbTransaction) {
    const invoice = await invoiceRepository.findById(id, tx);
    if (!invoice) throw errors.tidakDitemukan("Tagihan tidak ditemukan");
    return invoice;
  },

  async findInvoiceByOrderId(orderId: string, tx?: DbTransaction) {
    const invoice = await invoiceRepository.findByOrderId(orderId, tx);
    if (!invoice) throw errors.tidakDitemukan("Tagihan tidak ditemukan untuk pesanan ini");
    return invoice;
  },

  // ── Payment ───────────────────────────────────────────────────────────────

  async recordPayment(
    invoiceId: string,
    data: { metode: "transfer" | "deposit"; buktiBayar?: string; jumlah: number },
    userId: string,
    tx?: DbTransaction,
  ) {
    const invoice = await invoiceRepository.findById(invoiceId, tx);
    if (!invoice) throw errors.tidakDitemukan("Tagihan tidak ditemukan");
    if (invoice.status === "lunas") throw errors.konflik("Tagihan sudah lunas");

    const payment = await paymentRepository.create(
      { invoiceId, metode: data.metode, buktiBayar: data.buktiBayar, jumlah: data.jumlah, status: "menunggu validasi" },
      tx,
    );
    await catatStatus("Payment", payment.id, undefined, "menunggu validasi", userId, tx);
    return payment;
  },

  async findPaymentById(id: string, tx?: DbTransaction) {
    const payment = await paymentRepository.findById(id, tx);
    if (!payment) throw errors.tidakDitemukan("Pembayaran tidak ditemukan");
    return payment;
  },

  // Called by S12 when admin approves — sets payment + invoice to "lunas"
  async approvePayment(id: string, userId: string, tx?: DbTransaction) {
    const payment = await paymentRepository.findById(id, tx);
    if (!payment) throw errors.tidakDitemukan("Pembayaran tidak ditemukan");
    if (payment.status !== "menunggu validasi") throw errors.konflik("Pembayaran tidak dalam status menunggu validasi");

    const updated = await paymentRepository.updateStatus(id, { status: "lunas" }, tx);
    await catatStatus("Payment", id, payment.status, "lunas", userId, tx);

    // Mark invoice as paid
    await invoiceRepository.updateStatus(payment.invoiceId, "lunas", tx);
    await catatStatus("Invoice", payment.invoiceId, "belum dibayar", "lunas", userId, tx);

    return updated;
  },

  // Called by S12 when admin rejects
  async rejectPayment(id: string, alasan: string, userId: string, tx?: DbTransaction) {
    const payment = await paymentRepository.findById(id, tx);
    if (!payment) throw errors.tidakDitemukan("Pembayaran tidak ditemukan");
    if (payment.status !== "menunggu validasi") throw errors.konflik("Pembayaran tidak dalam status menunggu validasi");

    const updated = await paymentRepository.updateStatus(id, { status: "ditolak", alasanPenolakan: alasan }, tx);
    await catatStatus("Payment", id, payment.status, "ditolak", userId, tx);
    return updated;
  },
};
