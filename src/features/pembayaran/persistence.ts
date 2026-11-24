import type { PaymentsState } from "./model";
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const strings = (value: Record<string, unknown>, keys: string[]) =>
  keys.every((key) => typeof value[key] === "string");
export function isPaymentsState(value: unknown): value is PaymentsState {
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.attempts) ||
    !Array.isArray(value.invoices)
  )
    return false;
  return (
    value.attempts.every(
      (attempt) =>
        record(attempt) &&
        strings(attempt, ["id", "orderId", "submittedAt"]) &&
        ["transfer", "deposit"].includes(String(attempt.method)) &&
        ["pending", "approved", "rejected"].includes(String(attempt.status)) &&
        Number.isInteger(attempt.amount) &&
        Number(attempt.amount) > 0 &&
        (attempt.proof === null ||
          (record(attempt.proof) &&
            strings(attempt.proof, ["fileName"]) &&
            Number.isInteger(attempt.proof.amount))) &&
        ["reviewedAt", "reviewedBy", "rejectionReason"].every(
          (key) => attempt[key] === null || typeof attempt[key] === "string",
        ) &&
        ["balanceBefore", "balanceAfter"].every(
          (key) =>
            attempt[key] === null ||
            (typeof attempt[key] === "number" && Number.isFinite(attempt[key])),
        ),
    ) &&
    value.invoices.every(
      (invoice) =>
        record(invoice) &&
        strings(invoice, ["id", "orderId", "createdAt"]) &&
        Array.isArray(invoice.events) &&
        invoice.events.every(
          (event) =>
            record(event) &&
            strings(event, ["id", "title", "message", "occurredAt", "actor"]) &&
            ["issued", "reminder", "approved", "rejected"].includes(
              String(event.type),
            ),
        ),
    )
  );
}
