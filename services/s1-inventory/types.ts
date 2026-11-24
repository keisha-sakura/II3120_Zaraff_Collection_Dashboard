export const baleStatuses = ["di gudang", "disortir", "selesai disortir"] as const;
export const itemStatuses = ["di laundry", "tersedia", "dipesan", "terjual", "keluar gudang", "diretur", "dihapusbukukan"] as const;

export type BaleStatus = (typeof baleStatuses)[number];
export type ItemStatus = (typeof itemStatuses)[number];
export type Actor = { id: string; role: string };
