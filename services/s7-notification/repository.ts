import { db, type DbTransaction } from "@backend/lib/db";

type Writer = typeof db | DbTransaction;
const client = (tx?: Writer) => tx ?? db;

export const notificationRepository = {
  listForRecipients: (tujuan: readonly string[]) =>
    db.notificationLog.findMany({
      where: { tujuan: { in: [...tujuan] } },
      orderBy: { waktu: "desc" },
    }),
  create: (
    data: { tipe: string; tujuan: string; isi: string; statusKirim: string },
    tx?: Writer,
  ) => client(tx).notificationLog.create({ data }),

  list: () => db.notificationLog.findMany({ orderBy: { waktu: "desc" } }),

  listForUser: (tujuan: string) =>
    db.notificationLog.findMany({
      where: { tujuan },
      orderBy: { waktu: "desc" },
    }),
};
