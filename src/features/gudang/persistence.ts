import type { WarehouseState } from "./model";
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const strings = (value: Record<string, unknown>, keys: string[]) =>
  keys.every((key) => typeof value[key] === "string");
export function isWarehouseState(value: unknown): value is WarehouseState {
  if (!record(value) || value.version !== 1) return false;
  const arrays = ["bales", "items", "locations", "returns", "movements"];
  if (
    !arrays.every(
      (key) => Array.isArray(value[key]) && value[key].every(record),
    )
  )
    return false;
  const data = value as Record<string, Record<string, unknown>[]>;
  return (
    data.bales.every(
      (bale) =>
        strings(bale, [
          "id",
          "supplier",
          "category",
          "receivedAt",
          "receivedBy",
        ]) &&
        ["stored", "sorting", "sorted"].includes(String(bale.status)) &&
        typeof bale.weightKg === "number" &&
        typeof bale.estimatedItems === "number" &&
        (bale.locationId === null || typeof bale.locationId === "string"),
    ) &&
    data.items.every(
      (item) =>
        strings(item, [
          "id",
          "baleId",
          "category",
          "condition",
          "sortedAt",
          "sortedBy",
        ]) &&
        [
          "Kemeja",
          "Kaos",
          "Celana",
          "Hoodie",
          "Jaket",
          "Dress",
          "Rok",
        ].includes(String(item.category)) &&
        [
          "laundry",
          "available",
          "reserved",
          "sold",
          "outbound",
          "returned",
          "written-off",
        ].includes(String(item.status)) &&
        [null, "A", "B", "C"].includes(item.grade as string | null) &&
        (item.price === null || typeof item.price === "number") &&
        [
          "locationId",
          "availableAt",
          "soldAt",
          "outboundAt",
          "laundryAt",
          "orderId",
        ].every((key) => item[key] === null || typeof item[key] === "string"),
    ) &&
    data.locations.every(
      (location) =>
        strings(location, ["id", "code", "description"]) &&
        ["bale", "rack"].includes(String(location.kind)),
    ) &&
    data.returns.every((item) =>
      strings(item, [
        "id",
        "baleId",
        "category",
        "condition",
        "reason",
        "createdAt",
        "createdBy",
      ]),
    ) &&
    data.movements.every((movement) =>
      strings(movement, [
        "id",
        "entityId",
        "occurredAt",
        "action",
        "from",
        "to",
        "actor",
      ]),
    )
  );
}
