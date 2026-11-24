import type { ShippingState } from "./model";
export function isShippingState(value: unknown): value is ShippingState {
  if (
    typeof value !== "object" ||
    value === null ||
    !("version" in value) ||
    value.version !== 1 ||
    !("packing" in value) ||
    !Array.isArray(value.packing)
  )
    return false;
  return value.packing.every((record: unknown) => {
    if (
      typeof record !== "object" ||
      record === null ||
      !("orderId" in record) ||
      typeof record.orderId !== "string" ||
      !("checklist" in record) ||
      typeof record.checklist !== "object" ||
      record.checklist === null ||
      !("packedAt" in record) ||
      !("packedBy" in record)
    )
      return false;
    const checklist = record.checklist;
    return (
      "pickedItemIds" in checklist &&
      Array.isArray(checklist.pickedItemIds) &&
      checklist.pickedItemIds.every((id: unknown) => typeof id === "string") &&
      "codeMatches" in checklist &&
      typeof checklist.codeMatches === "boolean" &&
      "conditionMatches" in checklist &&
      typeof checklist.conditionMatches === "boolean" &&
      "packed" in checklist &&
      typeof checklist.packed === "boolean" &&
      (record.packedAt === null ||
        (typeof record.packedAt === "string" &&
          Number.isFinite(Date.parse(record.packedAt)))) &&
      (record.packedBy === null || typeof record.packedBy === "string")
    );
  });
}
