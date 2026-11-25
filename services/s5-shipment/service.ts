import { db, type DbTransaction } from "@backend/lib/db";
import { errors } from "@backend/lib/errors";
import { catatStatus } from "@backend/services/audit/service";
import { shipmentRepository } from "./repository";
import {
  SHIPMENT_TRANSITIONS,
  type ShipmentDetail,
  type ShipmentStatus,
} from "./types";
import type { Shipment } from "@prisma/client";

export const shipmentService = {
  list: (): Promise<Shipment[]> => shipmentRepository.list(),
  forOrder: (
    orderId: string,
    tx?: DbTransaction,
  ): Promise<ShipmentDetail | null> =>
    shipmentRepository.findByOrder(orderId, tx),
  async byResi(noResi: string, tx?: DbTransaction): Promise<ShipmentDetail> {
    const shipment = await shipmentRepository.findByResi(noResi, tx);
    if (!shipment)
      throw errors.tidakDitemukan("Pengiriman dengan resi ini tidak ditemukan");
    return shipment;
  },
  async tracking(orderId: string): Promise<ShipmentDetail> {
    const shipment = await shipmentRepository.findByOrder(orderId);
    if (!shipment) throw errors.tidakDitemukan("Pengiriman tidak ditemukan");
    return shipment;
  },
  async create(
    data: { orderId: string; kurir: string; noResi: string },
    userId: string,
    tx?: DbTransaction,
  ): Promise<Shipment> {
    if (!tx)
      return db.$transaction((transaction) =>
        shipmentService.create(data, userId, transaction),
      );
    if (await shipmentRepository.findByOrder(data.orderId, tx))
      throw errors.konflik("Pesanan sudah diserahkan ke kurir");
    if (await shipmentRepository.findByResi(data.noResi, tx))
      throw errors.konflik("Nomor resi sudah digunakan");
    const shipment = await shipmentRepository.create(data, tx);
    await shipmentRepository.event(shipment.id, "diserahkan", undefined, tx);
    await catatStatus(
      "Shipment",
      shipment.id,
      undefined,
      shipment.status,
      userId,
      tx,
    );
    return shipment;
  },
  async updateStatus(
    orderId: string,
    status: ShipmentStatus,
    catatan: string | undefined,
    userId: string,
    tx?: DbTransaction,
  ): Promise<Shipment> {
    if (!tx)
      return db.$transaction((transaction) =>
        shipmentService.updateStatus(
          orderId,
          status,
          catatan,
          userId,
          transaction,
        ),
      );
    const shipment = await shipmentRepository.findByOrder(orderId, tx);
    if (!shipment) throw errors.tidakDitemukan("Pengiriman tidak ditemukan");
    const allowed = SHIPMENT_TRANSITIONS[shipment.status as ShipmentStatus];
    if (!allowed?.includes(status))
      throw errors.konflik(
        `Pengiriman tidak dapat berpindah dari ${shipment.status} ke ${status}`,
      );
    const updated = await shipmentRepository.update(shipment.id, status, tx);
    await shipmentRepository.event(shipment.id, status, catatan, tx);
    await catatStatus(
      "Shipment",
      shipment.id,
      shipment.status,
      status,
      userId,
      tx,
    );
    return updated;
  },
};
