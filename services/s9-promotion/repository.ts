import { db, type DbTransaction } from "@backend/lib/db";

type Writer = typeof db | DbTransaction;
const client = (tx?: Writer) => tx ?? db;

export const promotionRepository = {
  list: () =>
    db.promotion.findMany({
      include: { items: true },
      orderBy: { dibuatPada: "desc" },
    }),

  findById: (id: string, tx?: Writer) =>
    client(tx).promotion.findUnique({
      where: { id },
      include: { items: true },
    }),

  create: (
    data: { judul: string; isi: string; kanal: string; jadwalLive: Date; status: string },
    tx?: Writer,
  ) => client(tx).promotion.create({ data, include: { items: true } }),

  addItem: (data: { promotionId: string; itemId: string; kode: string }, tx?: Writer) =>
    client(tx).promotionItem.create({ data }),

  update: (
    id: string,
    data: Partial<{ judul: string; isi: string; kanal: string; jadwalLive: Date; status: string }>,
    tx?: Writer,
  ) => client(tx).promotion.update({ where: { id }, data, include: { items: true } }),
};
