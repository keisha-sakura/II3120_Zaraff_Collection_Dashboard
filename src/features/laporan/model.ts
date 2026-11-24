import type { Strategy } from "@/types/domain";
export type MonthlyStrategy = Strategy & {
  authorName: string;
  createdAt: string;
  sentAt: string | null;
};
export type ReportsState = { version: 1; strategies: MonthlyStrategy[] };
export type ReportsCommand =
  | { type: "save-strategy"; month: string; content: string }
  | { type: "send-strategy"; strategyId: string; recipientIds: string[] };
export type ReportsView = {
  page: "R01" | "R02" | "R03" | "R04" | "R05" | "R06" | "R07";
  entityId?: string;
};
export const reportReferenceDate = "2026-11-24T10:00:00+07:00";
export function monthLabel(month: string) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${month}-01T00:00:00+07:00`));
}
export function validMonth(month: string) {
  return (
    /^\d{4}-(0[1-9]|1[0-2])$/.test(month) &&
    month >= "2000-01" &&
    month <= "2100-12"
  );
}
