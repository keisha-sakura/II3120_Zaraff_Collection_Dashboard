import { db, type DbTransaction } from "@backend/lib/db";
import { errors } from "@backend/lib/errors";
import { inventoryService } from "@backend/services/s1-inventory/service";
import { orderService } from "@backend/services/s2-order/service";
import { shipmentService } from "@backend/services/s5-shipment/service";
import type { ShipmentStatus } from "@backend/services/s5-shipment/types";
import { notificationService } from "@backend/services/s7-notification/service";
import { packingRepository } from "./repository";
import type { PackingOrder } from "./types";
import type { PackingRecord, Shipment } from "@prisma/client";

async function packOrder(
  orderId: string,
  tx: DbTransaction | undefined,
): Promise<PackingOrder> {
  const order = await orderService.findById(orderId, tx);
  if (order.status !== "lunas")
    throw errors.konflik("Pengemasan hanya untuk pesanan lunas");
  const items = await Promise.all(
    order.items.map(async (entry) => {
      const item = await inventoryService.findItem(entry.kode, tx);
      if (
        !item ||
        item.orderId !== order.id ||
        item.status !== "terjual" ||
        !item.location
      )
        throw errors.konflik(
          `Item ${entry.kode} harus terjual dan memiliki lokasi untuk dikemas`,
        );
      return { itemId: item.id, kode: item.kode, location: item.location };
    }),
  );
  return { order, items };
}

export async function packingQueue(): Promise<PackingOrder[]> {
  const orders = await orderService.list({ status: "lunas" });
  return Promise.all(orders.map((order) => packOrder(order.id, undefined)));
}

export async function qualityCheck(
  orderId: string,
  kodeDitemukan: readonly string[],
  userId: string,
): Promise<PackingRecord> {
  return db.$transaction(async (tx) => {
    const { items } = await packOrder(orderId, tx);
    const found = new Set(kodeDitemukan);
    const sesuai =
      found.size === kodeDitemukan.length &&
      items.length === kodeDitemukan.length &&
      items.every((item) => found.has(item.kode));
    return packingRepository.qualityCheck(orderId, sesuai, userId, tx);
  });
}

export async function pack(
  orderId: string,
  userId: string,
): Promise<PackingRecord> {
  return db.$transaction(async (tx) => {
    await packOrder(orderId, tx);
    const record = await packingRepository.find(orderId, tx);
    if (!record?.qcDiterima || record.qcHasil !== "sesuai")
      throw errors.konflik("Quality check harus sesuai sebelum dikemas");
    const result = await packingRepository.pack(orderId, userId, tx);
    const order = await orderService.updateStatus(
      orderId,
      "dikemas",
      userId,
      tx,
    );
    await notificationService.send(
      {
        tipe: "packDone",
        tujuan: order.customerId,
        isi: JSON.stringify({ idPesanan: orderId, hasilQC: record.qcHasil }),
      },
      tx,
    );
    return result;
  });
}

export async function handover(
  orderId: string,
  data: { kurir: string; noResi: string },
  userId: string,
): Promise<Shipment> {
  return db.$transaction(async (tx) => {
    const order = await orderService.findById(orderId, tx);
    if (order.status !== "dikemas")
      throw errors.konflik("Pesanan harus dikemas sebelum diserahkan ke kurir");
    const shipment = await shipmentService.create(
      { orderId, ...data },
      userId,
      tx,
    );
    for (const item of order.items)
      await inventoryService.shipItem(item.itemId, orderId, userId, tx);
    await orderService.updateStatus(orderId, "dikirim", userId, tx);
    await notificationService.send(
      {
        tipe: "statusUpdate",
        tujuan: order.customerId,
        isi: JSON.stringify({
          idPesanan: orderId,
          ...data,
          status: shipment.status,
        }),
      },
      tx,
    );
    return shipment;
  });
}

export async function updateShipmentStatus(
  orderId: string,
  status: ShipmentStatus,
  catatan: string | undefined,
  userId: string,
  tx?: DbTransaction,
): Promise<Shipment> {
  if (!tx)
    return db.$transaction((transaction) =>
      updateShipmentStatus(orderId, status, catatan, userId, transaction),
    );
  const order = await orderService.findById(orderId, tx);
  if (order.status !== "dikirim")
    throw errors.konflik("Pesanan harus dalam status dikirim");
  const shipment = await shipmentService.updateStatus(
    orderId,
    status,
    catatan,
    userId,
    tx,
  );
  if (status === "diterima")
    await orderService.updateStatus(orderId, "selesai", userId, tx);
  await notificationService.send(
    {
      tipe: "statusUpdate",
      tujuan: order.customerId,
      isi: JSON.stringify({
        idPesanan: orderId,
        noResi: shipment.noResi,
        status,
      }),
    },
    tx,
  );
  return shipment;
}

export async function deliveryStatus(
  noResi: string,
  status: ShipmentStatus,
): Promise<Shipment> {
  return db.$transaction(async (tx) => {
    const shipment = await shipmentService.byResi(noResi, tx);
    return updateShipmentStatus(
      shipment.orderId,
      status,
      undefined,
      "contract",
      tx,
    );
  });
}
