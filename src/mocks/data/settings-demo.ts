import type { SettingsState } from "@/features/pengaturan/model";
import { mockPriceRules } from "./warehouse-demo.ts";
export function createSettingsDemo(): SettingsState {
  return { version: 1, priceRules: structuredClone(mockPriceRules) };
}
