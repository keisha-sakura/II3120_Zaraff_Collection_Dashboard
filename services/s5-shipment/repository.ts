import { db, type DbTransaction } from "@backend/lib/db";
import type { Shipment, ShipmentEvent } from "@prisma/client";
import type { ShipmentDetail, ShipmentStatus } from "./types";

export const shipmentRepository = {
  list: (): Promise<Shipment[]> => db.shipment.findMany(),
  findByOrder: (
    orderId: string,
    tx?: DbTransaction,
  ): Promise<ShipmentDetail | null> =>
    (tx ?? db).shipment.findUnique({
      where: { orderId },
      include: { events: { orderBy: { waktu: "asc" } } },
    }),
  findByResi: (
    noResi: string,
    tx?: DbTransaction,
  ): Promise<ShipmentDetail | null> =>
    (tx ?? db).shipment.findUnique({
      where: { noResi },
      include: { events: { orderBy: { waktu: "asc" } } },
    }),
  create: (
    data: { orderId: string; kurir: string; noResi: string },
    tx: DbTransaction,
  ): Promise<Shipment> =>
    tx.shipment.create({ data: { ...data, status: "diserahkan" } }),
  update: (
    id: string,
    status: ShipmentStatus,
    tx: DbTransaction,
  ): Promise<Shipment> =>
    tx.shipment.update({ where: { id }, data: { status } }),
  event: (
    shipmentId: string,
    status: ShipmentStatus,
    catatan: string | undefined,
    tx: DbTransaction,
  ): Promise<ShipmentEvent> =>
    tx.shipmentEvent.create({ data: { shipmentId, status, catatan } }),
};
