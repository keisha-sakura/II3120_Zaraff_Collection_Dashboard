// S4 Payment — entity service.
// Aturan SOA: service ini tidak boleh mengimpor service task manapun.
// Semua orkestrasi lintas service ada di S12 Order Fulfillment.

import type { Invoice, Payment } from "@prisma/client";
import { db, type DbTransaction } from "@backend/lib/db";
import { errors } from "@backend/lib/errors";
import { catatStatus } from "@backend/services/audit/service";
import { invoiceRepository, paymentRepository } from "./repository";

export const paymentService = {
  listPayments: () => paymentRepository.list(),
  invoiceForOrder: (orderId: string, tx?: DbTransaction) =>
    invoiceRepository.findByOrderId(orderId, tx),
  // ── Invoice ──────────────────────────────────────────────────────────────

  async createInvoice(
    data: { orderId: string; subtotal: number; diskon: number; jumlah: number },
    userId: string,
    tx?: DbTransaction,
  ): Promise<Invoice> {
    if (!tx)
      return db.$transaction((transaction) =>
        paymentService.createInvoice(data, userId, transaction),
      );
    const existing = await invoiceRepository.findByOrderId(data.orderId, tx);
    if (existing) throw errors.konflik("Tagihan untuk pesanan ini sudah ada");
    const invoice = await invoiceRepository.create(
      { ...data, status: "belum dibayar" },
      tx,
    );
    await catatStatus(
      "Invoice",
      invoice.id,
      undefined,
      invoice.status,
      userId,
      tx,
    );
    return invoice;
  },

  async findInvoiceById(id: string, tx?: DbTransaction) {
    const invoice = await invoiceRepository.findById(id, tx);
    if (!invoice) throw errors.tidakDitemukan("Tagihan tidak ditemukan");
    return invoice;
  },

  async findInvoiceByOrderId(orderId: string, tx?: DbTransaction) {
    const invoice = await invoiceRepository.findByOrderId(orderId, tx);
    if (!invoice)
      throw errors.tidakDitemukan("Tagihan tidak ditemukan untuk pesanan ini");
    return invoice;
  },

  // ── Payment ───────────────────────────────────────────────────────────────

  async recordPayment(
    invoiceId: string,
    data: {
      metode: "transfer" | "deposit";
      buktiBayar?: string;
      jumlah?: number;
    },
    userId: string,
    tx?: DbTransaction,
  ): Promise<Payment> {
    if (!tx)
      return db.$transaction((transaction) =>
        paymentService.recordPayment(invoiceId, data, userId, transaction),
      );
    const invoice = await invoiceRepository.findById(invoiceId, tx);
    if (!invoice) throw errors.tidakDitemukan("Tagihan tidak ditemukan");
    if (invoice.status === "lunas") throw errors.konflik("Tagihan sudah lunas");
    if (data.metode === "transfer" && !data.buktiBayar?.trim())
      throw errors.validasi("Bukti bayar wajib untuk metode transfer");
    if (data.jumlah !== undefined && data.jumlah !== invoice.jumlah)
      throw errors.konflik("Jumlah pembayaran harus sama dengan tagihan");

    const payment = await paymentRepository.create(
      {
        invoiceId,
        metode: data.metode,
        buktiBayar: data.buktiBayar,
        jumlah: invoice.jumlah,
        status: "menunggu validasi",
      },
      tx,
    );
    await catatStatus(
      "Payment",
      payment.id,
      undefined,
      "menunggu validasi",
      userId,
      tx,
    );
    return payment;
  },

  async findPaymentById(id: string, tx?: DbTransaction) {
    const payment = await paymentRepository.findById(id, tx);
    if (!payment) throw errors.tidakDitemukan("Pembayaran tidak ditemukan");
    return payment;
  },

  // Called by S12 when admin approves — sets payment + invoice to "lunas"
  async approvePayment(
    id: string,
    userId: string,
    tx?: DbTransaction,
  ): Promise<Payment> {
    if (!tx)
      return db.$transaction((transaction) =>
        paymentService.approvePayment(id, userId, transaction),
      );
    const payment = await paymentRepository.findById(id, tx);
    if (!payment) throw errors.tidakDitemukan("Pembayaran tidak ditemukan");
    if (payment.status !== "menunggu validasi")
      throw errors.konflik("Pembayaran tidak dalam status menunggu validasi");
    if (payment.invoice.status !== "belum dibayar")
      throw errors.konflik("Tagihan sudah lunas");
    if (payment.jumlah !== payment.invoice.jumlah)
      throw errors.konflik("Jumlah pembayaran tidak sesuai tagihan");

    const updated = await paymentRepository.updateStatus(
      id,
      { status: "lunas" },
      tx,
    );
    await catatStatus("Payment", id, payment.status, "lunas", userId, tx);

    // Mark invoice as paid
    await invoiceRepository.updateStatus(payment.invoiceId, "lunas", tx);
    await catatStatus(
      "Invoice",
      payment.invoiceId,
      "belum dibayar",
      "lunas",
      userId,
      tx,
    );

    return updated;
  },

  // Called by S12 when admin rejects
  async rejectPayment(
    id: string,
    alasan: string,
    userId: string,
    tx?: DbTransaction,
  ): Promise<Payment> {
    if (!tx)
      return db.$transaction((transaction) =>
        paymentService.rejectPayment(id, alasan, userId, transaction),
      );
    if (!alasan.trim())
      throw errors.validasi("Alasan wajib diisi saat menolak pembayaran");
    const payment = await paymentRepository.findById(id, tx);
    if (!payment) throw errors.tidakDitemukan("Pembayaran tidak ditemukan");
    if (payment.status !== "menunggu validasi")
      throw errors.konflik("Pembayaran tidak dalam status menunggu validasi");

    const updated = await paymentRepository.updateStatus(
      id,
      { status: "ditolak", alasanPenolakan: alasan },
      tx,
    );
    await catatStatus("Payment", id, payment.status, "ditolak", userId, tx);
    return updated;
  },
};
