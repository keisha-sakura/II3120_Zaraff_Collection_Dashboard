import type { LiveSession, User } from "@/types/domain";

export type OwnerNote = {
  publishedAt: string;
  title: string;
  lines: readonly string[];
};
export type OwnerHomeData = {
  role: "owner";
  monthLabel: string;
  soldItems: number;
  salesProgress: number;
  orders: {
    completed: number;
    shipped: number;
    packed: number;
    paid?: number;
    awaitingPayment: number;
  };
  income: number;
  incomeProgress: number;
  nextStrategyMonth: string;
  previousReportMonth: string;
  previousReportLabel: string;
};
export type AdminHomeData = {
  role: "admin";
  liveLabel: string;
  payments: { paid: number; pending: number; unpaid: number };
  shipping: { delivered: number; inTransit: number; awaitingDispatch: number };
  live: { completed: number; scheduled: number };
  readyToShip: number;
  draftPromotion: string;
};
export type SorterHomeData = {
  role: "penyortir";
  baleId: string;
  baleCategory: string;
  sortedItems: number;
  totalItems: number;
  launderedItems: number;
  note: OwnerNote;
};
export type PackingHomeData = {
  role: "packing";
  packedOrders: number;
  paidOrders: number;
  pickedItems: number;
  totalItems: number;
  note: OwnerNote;
};
export type HostHomeData = {
  role: "live-host";
  completedLives: number;
  scheduledLives: number;
  upcoming: readonly LiveSession[];
  note: OwnerNote;
};
export type HomeDashboardData =
  | OwnerHomeData
  | AdminHomeData
  | SorterHomeData
  | PackingHomeData
  | HostHomeData;
export type HomeDashboard = { user: User; data: HomeDashboardData };

export function progressPercentage(completed: number, total: number) {
  return total > 0
    ? Math.min(100, Math.max(0, Math.round((completed / total) * 100)))
    : 0;
}
