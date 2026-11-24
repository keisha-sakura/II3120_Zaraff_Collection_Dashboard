import { db, type DbTransaction } from "@backend/lib/db";

type Writer = typeof db | DbTransaction;
const c = (tx?: Writer) => tx ?? db;

export const liveSessionRepository = {
  create: (judul: string, tx?: Writer) =>
    c(tx).liveSession.create({ data: { judul, status: "berjalan" }, include: { claims: false } }),

  findById: (id: string, tx?: Writer) =>
    c(tx).liveSession.findUnique({ where: { id }, include: { claims: true } }),

  findActive: (tx?: Writer) =>
    c(tx).liveSession.findFirst({ where: { status: "berjalan" } }),

  close: (id: string, tx?: Writer) =>
    c(tx).liveSession.update({ where: { id }, data: { status: "encerrado", selesai: new Date() } }),

  updateStatus: (id: string, status: string, tx?: Writer) =>
    c(tx).liveSession.update({ where: { id }, data: { status, ...(status === "selesai" ? { selesai: new Date() } : {}) } }),

  list: () => db.liveSession.findMany({ orderBy: { mulai: "desc" } }),
};

export const claimRepository = {
  create: (
    data: {
      sessionId: string;
      kodeItem: string;
      customerId: string;
      handle: string;
      komentar: string;
      waktuKomentar: Date;
      status: string;
      alasan?: string;
    },
    tx?: Writer,
  ) => c(tx).claim.create({ data }),

  listBySession: (sessionId: string) =>
    db.claim.findMany({ where: { sessionId }, orderBy: { waktuKomentar: "asc" } }),

  updateStatus: (id: string, status: string, alasan?: string, tx?: Writer) =>
    c(tx).claim.update({ where: { id }, data: { status, ...(alasan !== undefined ? { alasan } : {}) } }),

  /**
   * Atomic reserve: update item status 'tersedia' → 'dipesan' + set orderId in one hit.
   * Returns count of rows updated (0 = race lost, item already taken).
   */
  atomicReserveItem: (itemId: string, orderId: string, tx: Writer) =>
    (tx as typeof db).item.updateMany({
      where: { id: itemId, status: "tersedia" },
      data: { status: "dipesan", orderId },
    }),
};
