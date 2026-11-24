import type { ReportsState } from "@/features/laporan/model";
export const strategyRecipients = [
  { id: "user-admin", name: "Keisha", role: "Admin" },
  { id: "user-sorter", name: "Jojo", role: "Penyortir" },
  { id: "user-host", name: "Nadia", role: "Live Host" },
  { id: "user-packing", name: "Rizky", role: "Tim Packing" },
] as const;
export const strategySuggestion =
  "1. Live jaket dan hoodie tiap Sabtu sampai akhir tahun.\n2. Diskon 20% untuk stok lebih dari 60 hari.\n3. Penyortir: selesaikan bale Dress dan Rok minggu ini.\n4. Packing: kirim di hari yang sama sebelum 16.00.";
export function createReportsDemo(): ReportsState {
  return {
    version: 1,
    strategies: [
      {
        id: "strategy-2026-11",
        month: "2026-11",
        content:
          "Jadwalkan 2 live jaket per minggu; kaos vintage masuk promo bundling.",
        authorId: "user-owner",
        authorName: "Zahra",
        createdAt: "2026-10-31T09:00:00+07:00",
        sentAt: "2026-10-31T10:00:00+07:00",
        recipientIds: strategyRecipients.map((user) => user.id),
      },
      {
        id: "strategy-2026-10",
        month: "2026-10",
        content: "Fokus bale jaket impor; uji live dua kali seminggu.",
        authorId: "user-owner",
        authorName: "Zahra",
        createdAt: "2026-09-30T09:00:00+07:00",
        sentAt: "2026-09-30T10:00:00+07:00",
        recipientIds: strategyRecipients.map((user) => user.id),
      },
    ],
  };
}
