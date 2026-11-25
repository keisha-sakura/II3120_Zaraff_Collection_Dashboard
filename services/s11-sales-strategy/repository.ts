import { db, type DbTransaction } from "@backend/lib/db";
import type { Strategy } from "@prisma/client";
export const strategyRepository = {
  list: (): Promise<Strategy[]> =>
    db.strategy.findMany({ orderBy: { periode: "desc" } }),
  find: (periode: string, tx: DbTransaction): Promise<Strategy | null> =>
    tx.strategy.findUnique({ where: { periode } }),
  create: (
    data: { periode: string; isi: string; dibuatOleh: string },
    tx: DbTransaction,
  ): Promise<Strategy> => tx.strategy.create({ data }),
};
