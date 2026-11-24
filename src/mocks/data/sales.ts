import type { Customer, LiveSession, Order } from "@/types/domain";
export const mockCustomers: readonly Customer[] = [
  {
    id: "customer-dodi",
    name: "Dodi Pratama",
    handle: "@dodi_ootd",
    phone: "0813-2222-1904",
    isMember: false,
    depositBalance: 0,
  },
  {
    id: "customer-sari",
    name: "Sari Wulandari",
    handle: "@sarivintage",
    phone: "0857-1100-2231",
    isMember: true,
    depositBalance: 0,
  },
];
export const mockOrders: readonly Order[] = [
  {
    id: "ORD-261121-001",
    customerId: "customer-dodi",
    itemIds: ["ZR-2610-0011"],
    createdAt: "2026-11-21T20:00:00+07:00",
    subtotal: 85000,
    memberDiscount: 0,
    total: 85000,
    status: "paid",
  },
  {
    id: "ORD-261121-003",
    customerId: "customer-sari",
    itemIds: ["ZR-2610-0013"],
    createdAt: "2026-11-21T20:00:00+07:00",
    subtotal: 65000,
    memberDiscount: 6500,
    total: 58500,
    status: "awaiting-payment",
  },
];
export const mockLiveSessions: readonly LiveSession[] = [
  {
    id: "live-261128",
    title: "Live Sabtu: Kemeja",
    scheduledAt: "2026-11-28T19:00:00+07:00",
    platform: "TikTok Live",
    hostId: "user-host",
    itemIds: ["ZR-2610-0014"],
    promotionChannels: ["Instagram", "TikTok"],
    status: "draft",
  },
];
