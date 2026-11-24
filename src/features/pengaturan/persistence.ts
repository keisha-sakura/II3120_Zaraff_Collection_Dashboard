import type { SettingsState } from "./model";
import { grades, maxRecommendedPrice } from "./model.ts";
import { categories } from "../gudang/model.ts";
export function isSettingsState(value: unknown): value is SettingsState {
  if (
    typeof value !== "object" ||
    value === null ||
    !("version" in value) ||
    value.version !== 1 ||
    !("priceRules" in value) ||
    typeof value.priceRules !== "object" ||
    value.priceRules === null
  )
    return false;
  const rules = value.priceRules as Record<string, unknown>;
  return categories.every((category) => {
    const row = rules[category];
    return (
      typeof row === "object" &&
      row !== null &&
      grades.every((grade) => {
        const amount = (row as Record<string, unknown>)[grade];
        return (
          typeof amount === "number" &&
          Number.isSafeInteger(amount) &&
          amount > 0 &&
          amount <= maxRecommendedPrice
        );
      })
    );
  });
}
