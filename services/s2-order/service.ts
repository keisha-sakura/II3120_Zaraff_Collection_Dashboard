import { db, type DbTransaction } from "@backend/lib/db";
import { errors } from "@backend/lib/errors";
import { catatStatus } from "@backend/services/audit/service";
import { orderRepository } from "./repository";
import { ORDER_TRANSITIONS, type OrderStatus } from "./types";

export const orderService = {
  async list(input: {
    status?: string;
    tanggalDari?: Date;
    tanggalSampai?: Date;
  }) {
    const where: Record<string, unknown> = {};
    if (input.status) where.status = input.status;
    if (input.tanggalDari || input.tanggalSampai) {
      where.dibuatPada = {
        ...(input.tanggalDari ? { gte: input.tanggalDari } : {}),
        ...(input.tanggalSampai ? { lte: input.tanggalSampai } : {}),
      };
    }
    return orderRepository.list(where);
  },

  async findById(id: string, tx?: DbTransaction) {
    const order = await orderRepository.findById(id, tx);
    if (!order) throw errors.tidakDitemukan("Pesanan tidak ditemukan");
    return order;
  },

  // Called by S10 (live selling) to create a new order atomically
  async createOrder(
    data: {
      customerId: string;
      subtotal: number;
      diskon: number;
      total: number;
      sumber: string;
      itemId: string;
      kode: string;
      harga: number;
    },
    tx?: DbTransaction,
  ): Promise<Awaited<ReturnType<typeof orderRepository.create>>> {
    if (!tx)
      return db.$transaction((transaction) =>
        orderService.createOrder(data, transaction),
      );
    const order = await orderRepository.create(
      {
        customerId: data.customerId,
        status: "menunggu pembayaran",
        subtotal: data.subtotal,
        diskon: data.diskon,
        total: data.total,
        sumber: data.sumber,
      },
      tx,
    );
    await orderRepository.addItem(
      {
        orderId: order.id,
        itemId: data.itemId,
        kode: data.kode,
        harga: data.harga,
      },
      tx,
    );
    await catatStatus(
      "Order",
      order.id,
      undefined,
      order.status,
      data.customerId,
      tx,
    );
    return order;
  },

  // Called by S12 when transitioning order status
  async updateStatus(
    id: string,
    toStatus: OrderStatus,
    userId: string,
    tx?: DbTransaction,
  ): Promise<Awaited<ReturnType<typeof orderRepository.updateStatus>>> {
    if (!tx)
      return db.$transaction((transaction) =>
        orderService.updateStatus(id, toStatus, userId, transaction),
      );
    const order = await orderRepository.findById(id, tx);
    if (!order) throw errors.tidakDitemukan("Pesanan tidak ditemukan");
    const allowed = ORDER_TRANSITIONS[order.status as OrderStatus] ?? [];
    if (!allowed.includes(toStatus))
      throw errors.konflik(
        `Pesanan tidak dapat berpindah dari ${order.status} ke ${toStatus}`,
      );
    await catatStatus("Order", id, order.status, toStatus, userId, tx);
    return orderRepository.updateStatus(id, toStatus, tx);
  },

  // Called by S12 to set invoice-calculated totals
  async updateTotals(
    id: string,
    data: { subtotal: number; diskon: number; total: number },
    tx?: DbTransaction,
  ) {
    return orderRepository.updateTotals(id, data, tx);
  },
};
