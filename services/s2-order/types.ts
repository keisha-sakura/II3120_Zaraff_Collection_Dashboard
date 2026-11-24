export type OrderStatus =
  | "menunggu pembayaran"
  | "lunas"
  | "dikemas"
  | "dikirim"
  | "selesai";

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  "menunggu pembayaran": ["lunas"],
  lunas: ["dikemas"],
  dikemas: ["dikirim"],
  dikirim: ["selesai"],
  selesai: [],
};
