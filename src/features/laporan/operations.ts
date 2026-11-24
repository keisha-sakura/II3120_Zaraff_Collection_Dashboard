import type { User } from "@/types/domain";
import type { ReportsState, ReportsCommand } from "./model";
import { validMonth } from "./model.ts";
import { canAccessPage } from "../../config/pages.ts";
export function applyReportsCommand(
  source: ReportsState,
  command: ReportsCommand,
  actor: User,
  now: string,
  recipients: readonly Pick<User, "id">[] = [],
) {
  if (
    !canAccessPage(actor.role, command.type === "save-strategy" ? "R06" : "R07")
  )
    throw new Error("Strategi hanya tersedia untuk Owner dan Admin.");
  if (!Number.isFinite(Date.parse(now)))
    throw new Error("Waktu aktivitas tidak valid.");
  const state = structuredClone(source);
  if (command.type === "save-strategy") {
    const content = command.content.trim();
    if (!validMonth(command.month))
      throw new Error("Bulan strategi tidak valid.");
    if (!content || content.length > 10000)
      throw new Error("Isi strategi wajib diisi, maksimal 10.000 karakter.");
    if (state.strategies.some((strategy) => strategy.month === command.month))
      throw new Error(
        "Strategi bulan ini sudah tersedia. Buka strategi yang ada dari daftar.",
      );
    const id = `strategy-${command.month}`;
    state.strategies.unshift({
      id,
      month: command.month,
      content,
      authorId: actor.id,
      authorName: actor.name,
      createdAt: now,
      sentAt: null,
      recipientIds: [],
    });
    return { state, entityId: id };
  }
  const strategy = state.strategies.find(
    (strategy) => strategy.id === command.strategyId,
  );
  if (!strategy) throw new Error("Strategi tidak ditemukan.");
  if (strategy.sentAt) throw new Error("Strategi sudah dikirim.");
  if (
    !command.recipientIds.length ||
    new Set(command.recipientIds).size !== command.recipientIds.length ||
    !command.recipientIds.every((id) =>
      recipients.some((user) => user.id === id),
    )
  )
    throw new Error("Pilih minimal satu staf yang valid.");
  strategy.recipientIds = [...command.recipientIds];
  strategy.sentAt = now;
  return { state, entityId: strategy.id };
}
