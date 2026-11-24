import { db, type DbTransaction } from "@backend/lib/db";

type Writer = typeof db | DbTransaction;

export function createStatusLog(
  data: {
    entitas: string;
    entitasId: string;
    dariStatus?: string | null;
    keStatus: string;
    userId: string;
  },
  tx?: Writer,
) {
  return (tx ?? db).statusLog.create({ data });
}

export function listStatusLogs(entitas?: string, entitasId?: string) {
  return db.statusLog.findMany({
    where: { ...(entitas ? { entitas } : {}), ...(entitasId ? { entitasId } : {}) },
    orderBy: { waktu: "asc" },
  });
}
