import type { DbTransaction } from "@backend/lib/db";
import { createStatusLog, listStatusLogs } from "./repository";

export function catatStatus(
  entitas: string,
  entitasId: string,
  dariStatus: string | null | undefined,
  keStatus: string,
  userId: string,
  tx?: DbTransaction,
) {
  return createStatusLog({ entitas, entitasId, dariStatus, keStatus, userId }, tx);
}

export function riwayatStatus(entitas?: string, entitasId?: string) {
  return listStatusLogs(entitas, entitasId);
}
