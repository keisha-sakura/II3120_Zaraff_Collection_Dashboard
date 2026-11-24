import type { Notification } from "@/types/domain";
export const mockNotifications: readonly Notification[] = [
  {
    id: "notification-sari",
    type: "invoice",
    message: "Tagihan INV-261121-003: Rp 58.500 (diskon member 10%).",
    createdAt: "2026-11-21T20:00:00+07:00",
    recipientRoles: ["owner", "admin"],
  },
];
