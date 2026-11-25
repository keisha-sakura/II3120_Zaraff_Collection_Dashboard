import { db } from "@backend/lib/db";
import { errors } from "@backend/lib/errors";
import { inventoryService } from "@backend/services/s1-inventory/service";
import { orderService } from "@backend/services/s2-order/service";
import { memberService } from "@backend/services/s3-member/service";
import { paymentService } from "@backend/services/s4-payment/service";
import { notificationService } from "@backend/services/s7-notification/service";
import { pricingService } from "@backend/services/s6-pricing/service";
import { shipmentService } from "@backend/services/s5-shipment/service";
import { packingRepository } from "./repository";
import {
  packingQueue,
  qualityCheck,
  pack,
  handover,
  updateShipmentStatus,
  deliveryStatus,
} from "./fulfillment";

export const fulfillmentService = {
  packingQueue,
  qualityCheck,
  pack,
  handover,
  updateShipmentStatus,
  deliveryStatus,
  // ── POST /orders/:id/invoice ──────────────────────────────────────────────
  async createInvoice(orderId: string, userId: string) {
    return db.$transaction(async (tx) => {
      const order = await orderService.findById(orderId, tx);
      if (order.status !== "menunggu pembayaran")
        throw errors.konflik(
          "Tagihan hanya dapat dibuat untuk pesanan yang menunggu pembayaran",
        );
      // S3: get customer for member check
      const customer = await memberService.getById(order.customerId, tx);

      const diskonPersen = customer.isMember
        ? await pricingService.memberDiscount(tx)
        : 0;

      const subtotal = order.items.reduce((sum, item) => sum + item.harga, 0);
      const diskon = Math.floor((subtotal * diskonPersen) / 100);
      const jumlah = subtotal - diskon;

      // S2: update totals
      await orderService.updateTotals(
        orderId,
        { subtotal, diskon, total: jumlah },
        tx,
      );

      // S4: create invoice
      const invoice = await paymentService.createInvoice(
        { orderId, subtotal, diskon, jumlah },
        userId,
        tx,
      );

      // S7: notify
      await notificationService.send(
        {
          tipe: "invoiceCreated",
          tujuan: order.customerId,
          isi: `Tagihan #${invoice.id} sebesar Rp${jumlah} telah dibuat`,
        },
        tx,
      );

      return invoice;
    });
  },

  // ── POST /invoices/:id/payments ───────────────────────────────────────────
  async recordPayment(
    invoiceId: string,
    data: {
      metode: "transfer" | "deposit";
      buktiBayar?: string;
      jumlah?: number;
    },
    userId: string,
  ) {
    return paymentService.recordPayment(invoiceId, data, userId);
  },

  // ── POST /payments/:id/validate ───────────────────────────────────────────
  async validatePayment(
    paymentId: string,
    keputusan: "setuju" | "tolak",
    alasan: string | undefined,
    userId: string,
  ) {
    if (keputusan === "tolak") {
      if (!alasan)
        throw errors.validasi("Alasan wajib diisi saat menolak pembayaran");
      return paymentService.rejectPayment(paymentId, alasan, userId);
    }

    // keputusan === "setuju"
    return db.$transaction(async (tx) => {
      const payment = await paymentService.findPaymentById(paymentId, tx);
      const invoice = await paymentService.findInvoiceById(
        payment.invoiceId,
        tx,
      );
      const order = await orderService.findById(invoice.orderId, tx);
      if (order.status !== "menunggu pembayaran")
        throw errors.konflik("Pesanan tidak menunggu pembayaran");

      // S3: deduct deposit if applicable
      if (payment.metode === "deposit") {
        await memberService.deductDeposit(order.customerId, invoice.jumlah, tx);
      }

      // S4: approve payment + mark invoice lunas
      const approved = await paymentService.approvePayment(
        paymentId,
        userId,
        tx,
      );

      // S2: order → lunas
      await orderService.updateStatus(order.id, "lunas", userId, tx);

      // S1: items → terjual (via S1 repository — S12 is allowed to call S1)
      for (const orderItem of order.items) {
        await inventoryService.sellItem(orderItem.itemId, order.id, userId, tx);
      }

      // S7: payConfirmed
      await notificationService.send(
        {
          tipe: "payConfirmed",
          tujuan: order.customerId,
          isi: `Pembayaran pesanan #${order.id} telah disetujui`,
        },
        tx,
      );

      return approved;
    });
  },

  // ── POST /orders/:id/payment-reminder ─────────────────────────────────────
  async sendPaymentReminder(orderId: string, userId: string) {
    const order = await orderService.findById(orderId);
    if (order.status !== "menunggu pembayaran")
      throw errors.konflik("Pengingat hanya untuk pesanan yang belum lunas");
    const invoice = await paymentService.findInvoiceByOrderId(orderId);
    await notificationService.send({
      tipe: "paymentReminder",
      tujuan: order.customerId,
      isi: `Pengingat: Tagihan #${invoice.id}, pesanan #${orderId}, Rp${invoice.jumlah}. Petugas: ${userId}`,
    });
    return { pesan: "Pengingat pembayaran berhasil dikirim" };
  },

  // ── GET /orders/:id — full detail orchestrated by S12 ────────────────────
  async orderDetail(orderId: string) {
    const order = await orderService.findById(orderId);
    const invoice = await paymentService.invoiceForOrder(orderId);
    const packing = await packingRepository.find(orderId);
    const shipment = await shipmentService.forOrder(orderId);
    const customer = await memberService.getById(order.customerId);
    return { order, customer, invoice, packing, shipment };
  },
};
