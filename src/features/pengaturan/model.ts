import type { Grade, ItemCategory } from "@/types/domain";
export type PriceRules = Record<ItemCategory, Record<Grade, number>>;
export type SettingsState = { version: 1; priceRules: PriceRules };
export type SettingsCommand =
  | { type: "save-prices"; priceRules: PriceRules }
  | { type: "save-discount"; percent: number }
  | { type: "add-location"; code: string; description: string };
export type SettingsView = { page: "S01" | "S02" | "S03" };
export const grades = ["A", "B", "C"] as const;
export const gradeConditions = {
  A: "Sangat baik (tanpa cacat)",
  B: "Baik (cacat minor)",
  C: "Layak (cacat terlihat)",
};
export const maxRecommendedPrice = 1000000000;
