import type {
  Customer,
  Grade,
  ItemCategory,
  LiveSession,
  Order,
  Shipment,
} from "@/types/domain";
export type SalesCustomer = Customer & { joinedAt: string };
export type DepositEntry = {
  id: string;
  customerId: string;
  occurredAt: string;
  description: string;
  amount: number;
};
export type OrderLine = {
  itemId: string;
  category: ItemCategory;
  grade: Grade;
  price: number;
};
export type SalesOrder = Order & {
  liveId: string | null;
  lines: OrderLine[];
  paymentStatus: "pending" | "approved" | "unpaid";
  shipment:
    | (Shipment & {
        events: { title: string; dateTime: string; description: string }[];
      })
    | null;
};
export type ClaimRow = {
  line: number;
  handle: string;
  itemCode: string;
  time: string;
  milliseconds: number | null;
  error: string | null;
};
export type ClaimResult = ClaimRow & {
  id: string;
  outcome: "won" | "rejected" | "invalid";
  reason: string;
  orderId: string | null;
};
export type SalesLive = LiveSession & {
  content: string;
  claimsProcessed: boolean;
  results: ClaimResult[];
};
export type LiveContent = {
  title: string;
  content: string;
  scheduledAt: string;
  hostId: string;
  promotionChannels: string[];
};
export type LiveDraft = LiveContent & {
  editingId: string | null;
  itemIds: string[];
};
export type CustomerInput = {
  name: string;
  handle: string;
  phone: string;
  isMember: boolean;
};
export type SalesState = {
  version: 1;
  customers: SalesCustomer[];
  orders: SalesOrder[];
  lives: SalesLive[];
  deposits: DepositEntry[];
  draft: LiveDraft | null;
  memberDiscountPercent: number;
};
export type SalesCommand =
  | { type: "complete-live"; liveId: string }
  | { type: "discard-draft" }
  | { type: "start-draft"; liveId?: string }
  | { type: "save-content"; input: LiveContent }
  | { type: "select-items"; itemIds: string[] }
  | { type: "save-live"; publish: boolean }
  | { type: "process-claims"; liveId: string; text: string }
  | { type: "add-customer"; input: CustomerInput }
  | { type: "update-customer"; customerId: string; input: CustomerInput };
export type SalesView = {
  page:
    | "P01"
    | "P02"
    | "P03"
    | "P04"
    | "P05"
    | "P06"
    | "P07"
    | "P08"
    | "P09"
    | "P10";
  entityId?: string;
};
export const liveHosts = [
  { id: "user-host", name: "Nadia" },
  { id: "host-claudia", name: "Claudia" },
] as const;
export const promotionChannels = ["Instagram", "TikTok", "Shopee"] as const;
export const sampleClaims =
  "@rina.thrift,ZR-2609-0008,19:24:03.120\n@dodi_ootd,ZR-2609-0008,19:24:03.480\n@fajarkoleksi,ZR-2609-0009,19:25:10.002";
