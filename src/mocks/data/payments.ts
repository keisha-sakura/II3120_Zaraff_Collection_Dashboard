import type { Payment } from "@/types/domain";
export const mockPayments: readonly Payment[] = [
  {
    id: "payment-dodi",
    orderId: "ORD-261121-001",
    method: "transfer",
    amount: 85000,
    submittedAt: "2026-11-22T14:00:00+07:00",
    status: "approved",
  },
  {
    id: "payment-sari",
    orderId: "ORD-261121-003",
    method: "transfer",
    amount: 48500,
    submittedAt: "2026-11-23T11:20:00+07:00",
    status: "pending",
  },
];
