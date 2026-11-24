import type {
  Bale,
  Grade,
  InventoryItem,
  ItemCategory,
  WarehouseLocation,
} from "@/types/domain";
export const categories = [
  "Kemeja",
  "Kaos",
  "Celana",
  "Hoodie",
  "Jaket",
  "Dress",
  "Rok",
] as const;
export const conditions = [
  "Sangat baik (tanpa cacat)",
  "Baik (cacat minor)",
  "Layak (cacat terlihat)",
  "Tidak Layak (cacat terlihat)",
] as const;
export type WarehouseItem = InventoryItem & {
  sortedAt: string;
  sortedBy: string;
  laundryAt: string | null;
  orderId: string | null;
};
export type WarehouseBale = Bale & { receivedBy: string };
export type SupplierReturn = {
  id: string;
  baleId: string;
  category: ItemCategory;
  condition: string;
  reason: string;
  createdAt: string;
  createdBy: string;
};
export type Movement = {
  id: string;
  entityId: string;
  occurredAt: string;
  action: string;
  from: string;
  to: string;
  actor: string;
};
export type WarehouseState = {
  history?: {
    id: string;
    itemId: string;
    occurredAt: string;
    status: string;
    grade: string | null;
    price: number | null;
    locationId: string | null;
    actorId: string | null;
  }[];
  version: 1;
  bales: WarehouseBale[];
  items: WarehouseItem[];
  locations: WarehouseLocation[];
  returns: SupplierReturn[];
  movements: Movement[];
};
export type ReceiveBaleInput = {
  supplier: string;
  category: string;
  weightKg: number;
  estimatedItems: number;
  receivedAt: string;
  locationId: string;
};
export type SortItemInput = {
  baleId: string;
  category: ItemCategory;
  condition: string;
  outcome: "laundry" | "return";
  reason: string;
};
export type WarehouseCommand =
  | { type: "receive"; input: ReceiveBaleInput }
  | { type: "start-sort"; baleId: string }
  | { type: "record-item"; input: SortItemInput }
  | { type: "finish-sort"; baleId: string }
  | {
      type: "grade";
      itemId: string;
      grade: Grade;
      price: number;
      locationId: string;
      confirmedClean: boolean;
    }
  | { type: "move"; itemId: string; locationId: string };

export type WarehouseView = {
  page: "G01" | "G02" | "G03" | "G04" | "G05" | "G07" | "G08" | "G09" | "G10";
  entityId?: string;
};
export const demoReferenceDate = "2026-11-24T10:00:00+07:00";
export function daysSince(value: string, reference = new Date().toISOString()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  function calendarDay(date: string) {
    const parts = formatter.formatToParts(new Date(date));
    const part = (type: string) =>
      Number(parts.find((part) => part.type === type)!.value);
    return Date.UTC(part("year"), part("month") - 1, part("day"));
  }
  return Math.max(
    0,
    Math.round((calendarDay(reference) - calendarDay(value)) / 86400000),
  );
}
export function recommendedGrade(condition: string): Grade {
  return condition.startsWith("Sangat baik")
    ? "A"
    : condition.startsWith("Baik")
      ? "B"
      : "C";
}
