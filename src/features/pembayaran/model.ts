export type PaymentAttempt = {
  id: string;
  orderId: string;
  method: "transfer" | "deposit";
  amount: number;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  proof: { fileName: string; amount: number; uploadId?: string } | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  balanceBefore: number | null;
  balanceAfter: number | null;
};
export type InvoiceEvent = {
  id: string;
  type: "issued" | "reminder" | "approved" | "rejected";
  title: string;
  message: string;
  occurredAt: string;
  actor: string;
};
export type Invoice = {
  id: string;
  orderId: string;
  createdAt: string;
  events: InvoiceEvent[];
};
export type PaymentsState = {
  version: 1;
  attempts: PaymentAttempt[];
  invoices: Invoice[];
};
export type PaymentCommand =
  | {
      type: "submit";
      orderId: string;
      method: "transfer" | "deposit";
      amount: number;
      proofId?: string;
    }
  | { type: "approve"; paymentId: string }
  | { type: "reject"; paymentId: string; reason: string }
  | { type: "remind"; invoiceId: string; requestId: string };
export type PaymentsView = {
  page: "Y01" | "Y02" | "Y03" | "Y05" | "Y06";
  entityId?: string;
};
export function invoiceIdForOrder(orderId: string) {
  return orderId.startsWith("ORD-")
    ? orderId.replace(/^ORD-/, "INV-")
    : `INV-${orderId}`;
}
