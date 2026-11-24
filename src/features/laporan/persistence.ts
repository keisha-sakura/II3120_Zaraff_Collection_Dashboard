import type { ReportsState } from "./model";
import { validMonth } from "./model.ts";
export function isReportsState(value: unknown): value is ReportsState {
  if (
    typeof value !== "object" ||
    value === null ||
    !("version" in value) ||
    value.version !== 1 ||
    !("strategies" in value) ||
    !Array.isArray(value.strategies)
  )
    return false;
  return value.strategies.every((row: unknown) => {
    if (typeof row !== "object" || row === null) return false;
    return (
      "id" in row &&
      typeof row.id === "string" &&
      "month" in row &&
      typeof row.month === "string" &&
      validMonth(row.month) &&
      "content" in row &&
      typeof row.content === "string" &&
      "authorId" in row &&
      typeof row.authorId === "string" &&
      "authorName" in row &&
      typeof row.authorName === "string" &&
      "createdAt" in row &&
      typeof row.createdAt === "string" &&
      Number.isFinite(Date.parse(row.createdAt)) &&
      "sentAt" in row &&
      (row.sentAt === null ||
        (typeof row.sentAt === "string" &&
          Number.isFinite(Date.parse(row.sentAt)))) &&
      "recipientIds" in row &&
      Array.isArray(row.recipientIds) &&
      row.recipientIds.every((id: unknown) => typeof id === "string")
    );
  });
}
