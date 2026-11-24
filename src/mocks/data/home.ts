import type {
  HomeDashboardData,
  OwnerNote,
} from "@/features/beranda/contracts";
import type { Role } from "@/config/roles";
import { mockLiveSessions } from "./sales.ts";

const strategy: Omit<OwnerNote, "lines"> = {
  publishedAt: "2026-10-31T09:00:00+07:00",
  title: "Strategi November 2026",
};

/** Reporting snapshots from the home artboards, separate from partial CRUD fixtures.
 * Owner's sales/income progress follows the provided visual snapshot: no target
 * has been invented. Ratios with explicit counts are calculated by the view.
 */
export const mockHomeData = {
  owner: {
    role: "owner",
    monthLabel: "November",
    soldItems: 6,
    salesProgress: 48,
    orders: { completed: 2, shipped: 1, packed: 1, awaitingPayment: 2 },
    income: 479500,
    incomeProgress: 60,
    nextStrategyMonth: "Desember",
    previousReportMonth: "2026-10",
    previousReportLabel: "Oktober 2026",
  },
  admin: {
    role: "admin",
    liveLabel: "live Jumat (21 Nov)",
    payments: { paid: 2, pending: 1, unpaid: 1 },
    shipping: { delivered: 2, inTransit: 1, awaitingDispatch: 2 },
    live: { completed: 6, scheduled: 10 },
    readyToShip: 1,
    draftPromotion: "Live Sabtu: Jaket dan Hoodie",
  },
  penyortir: {
    role: "penyortir",
    baleId: "BL-261119-001",
    baleCategory: "Kaos Campur",
    sortedItems: 6,
    totalItems: 12,
    launderedItems: 0,
    note: {
      ...strategy,
      lines: [
        "Jadwalkan 2 live jaket per minggu.",
        "Kaos vintage lebih dari 90 hari masuk promo bundling.",
        "Penyortir: prioritaskan bale kemeja sebelum pertengahan bulan.",
      ],
    },
  },
  packing: {
    role: "packing",
    packedOrders: 1,
    paidOrders: 3,
    pickedItems: 2,
    totalItems: 4,
    note: {
      ...strategy,
      lines: [
        "Jadwalkan 2 live jaket per minggu.",
        "Packing: kirim pesanan lunas di hari yang sama sebelum pukul 16.00.",
      ],
    },
  },
  "live-host": {
    role: "live-host",
    completedLives: 2,
    scheduledLives: 4,
    upcoming: mockLiveSessions.filter(
      (session) =>
        session.hostId === "user-host" && session.status !== "completed",
    ),
    note: {
      ...strategy,
      lines: [
        "Jadwalkan 2 live jaket per minggu.",
        "Kaos vintage lebih dari 90 hari masuk promo bundling.",
      ],
    },
  },
} as const satisfies Record<Role, HomeDashboardData>;
