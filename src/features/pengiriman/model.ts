export type PackingChecklist = {
  pickedItemIds: string[];
  codeMatches: boolean;
  conditionMatches: boolean;
  packed: boolean;
};
export type PackingRecord = {
  orderId: string;
  checklist: PackingChecklist;
  packedAt: string | null;
  packedBy: string | null;
};
export type ShippingState = { version: 1; packing: PackingRecord[] };
export type ShippingCommand =
  | { type: "save-checklist"; orderId: string; checklist: PackingChecklist }
  | { type: "mark-packed"; orderId: string }
  | {
      type: "dispatch";
      orderId: string;
      courier: string;
      trackingNumber: string;
      handedOver: boolean;
    };
export type ShippingView = {
  page: "D01" | "D02" | "D03" | "D04" | "D06";
  entityId?: string;
};
export const couriers = ["JNE", "J&T Express"] as const;
export function emptyChecklist(): PackingChecklist {
  return {
    pickedItemIds: [],
    codeMatches: false,
    conditionMatches: false,
    packed: false,
  };
}
export function checklistComplete(
  checklist: PackingChecklist,
  itemIds: readonly string[],
) {
  return (
    itemIds.length > 0 &&
    checklist.pickedItemIds.length === itemIds.length &&
    itemIds.every((id) => checklist.pickedItemIds.includes(id)) &&
    checklist.codeMatches &&
    checklist.conditionMatches &&
    checklist.packed
  );
}
