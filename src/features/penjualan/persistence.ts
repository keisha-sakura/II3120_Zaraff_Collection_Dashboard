import type { SalesState } from "./model";
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const strings = (value: Record<string, unknown>, keys: string[]) =>
  keys.every((key) => typeof value[key] === "string");
export function isSalesState(value: unknown): value is SalesState {
  if (
    !record(value) ||
    value.version !== 1 ||
    typeof value.memberDiscountPercent !== "number" ||
    !Number.isFinite(value.memberDiscountPercent) ||
    value.memberDiscountPercent < 0 ||
    value.memberDiscountPercent > 100
  )
    return false;
  if (
    !["customers", "orders", "lives", "deposits"].every(
      (key) => Array.isArray(value[key]) && value[key].every(record),
    )
  )
    return false;
  const data = value as Record<string, Record<string, unknown>[]>;
  const draft = value.draft;
  const validContent = (item: Record<string, unknown>) =>
    strings(item, ["title", "content", "scheduledAt", "hostId"]) &&
    Array.isArray(item.itemIds) &&
    item.itemIds.every((id) => typeof id === "string") &&
    Array.isArray(item.promotionChannels) &&
    item.promotionChannels.every((channel) => typeof channel === "string");
  return (
    (draft === null ||
      (record(draft) &&
        validContent(draft) &&
        (draft.editingId === null || typeof draft.editingId === "string"))) &&
    data.customers.every(
      (customer) =>
        strings(customer, ["id", "name", "handle", "phone", "joinedAt"]) &&
        typeof customer.isMember === "boolean" &&
        typeof customer.depositBalance === "number",
    ) &&
    data.orders.every(
      (order) =>
        strings(order, ["id", "customerId", "createdAt"]) &&
        ["awaiting-payment", "paid", "packed", "shipped", "completed"].includes(
          String(order.status),
        ) &&
        ["pending", "approved", "unpaid"].includes(
          String(order.paymentStatus),
        ) &&
        ["subtotal", "memberDiscount", "total"].every(
          (key) => typeof order[key] === "number",
        ) &&
        Array.isArray(order.itemIds) &&
        order.itemIds.every((id) => typeof id === "string") &&
        Array.isArray(order.lines) &&
        order.lines.every(
          (line) =>
            record(line) &&
            strings(line, ["itemId", "category", "grade"]) &&
            typeof line.price === "number",
        ) &&
        (order.shipment === null ||
          (record(order.shipment) &&
            strings(order.shipment, ["courier", "trackingNumber"]) &&
            Array.isArray(order.shipment.events) &&
            order.shipment.events.every(
              (event) =>
                record(event) &&
                strings(event, ["title", "dateTime", "description"]),
            ))),
    ) &&
    data.lives.every(
      (live) =>
        strings(live, ["id"]) &&
        validContent(live) &&
        ["draft", "published", "completed"].includes(String(live.status)) &&
        typeof live.claimsProcessed === "boolean" &&
        Array.isArray(live.results) &&
        live.results.every(
          (claim) =>
            record(claim) &&
            strings(claim, ["id", "handle", "itemCode", "time", "reason"]) &&
            ["won", "rejected", "invalid"].includes(String(claim.outcome)),
        ),
    ) &&
    data.deposits.every(
      (entry) =>
        strings(entry, ["id", "customerId", "occurredAt", "description"]) &&
        typeof entry.amount === "number",
    )
  );
}
