import type { Strategy } from "@/types/domain";
export const mockStrategies: readonly Strategy[] = [
  {
    id: "strategy-2026-11",
    month: "2026-11",
    content:
      "Jadwalkan 2 live jaket per minggu. Prioritaskan bale kemeja dan kirim pesanan lunas sebelum pukul 16.00.",
    authorId: "user-owner",
    recipientIds: ["user-admin", "user-sorter", "user-host", "user-packing"],
  },
];
