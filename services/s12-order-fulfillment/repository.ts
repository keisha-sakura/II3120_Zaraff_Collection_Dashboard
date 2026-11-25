import { db, type DbTransaction } from "@backend/lib/db";
import type { PackingRecord } from "@prisma/client";

export const packingRepository = {
  find: (orderId: string, tx?: DbTransaction): Promise<PackingRecord | null> =>
    (tx ?? db).packingRecord.findUnique({ where: { orderId } }),
  qualityCheck: (
    orderId: string,
    sesuai: boolean,
    userId: string,
    tx: DbTransaction,
  ): Promise<PackingRecord> => {
    const data = {
      qcDiterima: sesuai,
      qcHasil: sesuai ? "sesuai" : "gagal",
      qcOleh: userId,
      qcWaktu: new Date(),
    };
    return tx.packingRecord.upsert({
      where: { orderId },
      create: { orderId, ...data },
      update: data,
    });
  },
  pack: (
    orderId: string,
    userId: string,
    tx: DbTransaction,
  ): Promise<PackingRecord> =>
    tx.packingRecord.update({
      where: { orderId },
      data: { dikemasOleh: userId, dikemasWaktu: new Date() },
    }),
};
