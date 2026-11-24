import type { Role } from "@/config/roles";
export type User = { id: string; name: string; email: string; role: Role };
export type Grade = "A" | "B" | "C";
export type ItemCategory =
  "Kemeja" | "Kaos" | "Celana" | "Hoodie" | "Jaket" | "Dress" | "Rok";
export type ItemStatus =
  | "laundry"
  | "available"
  | "reserved"
  | "sold"
  | "outbound"
  | "returned"
  | "written-off";
export type BaleStatus = "stored" | "sorting" | "sorted";
export type OrderStatus =
  "awaiting-payment" | "paid" | "packed" | "shipped" | "completed";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type WarehouseLocation = {
  id: string;
  code: string;
  description: string;
  kind: "bale" | "rack";
};
export type Bale = {
  id: string;
  supplier: string;
  category: string;
  weightKg: number;
  estimatedItems: number;
  receivedAt: string;
  locationId: string | null;
  status: BaleStatus;
};
export type InventoryItem = {
  id: string;
  baleId: string;
  category: ItemCategory;
  condition: string;
  grade: Grade | null;
  price: number | null;
  status: ItemStatus;
  locationId: string | null;
  availableAt: string | null;
  soldAt: string | null;
  outboundAt: string | null;
};
export type Customer = {
  id: string;
  name: string;
  handle: string;
  phone: string;
  isMember: boolean;
  depositBalance: number;
};
export type Order = {
  id: string;
  customerId: string;
  itemIds: string[];
  createdAt: string;
  subtotal: number;
  memberDiscount: number;
  total: number;
  status: OrderStatus;
};
export type Payment = {
  id: string;
  orderId: string;
  method: "transfer" | "deposit";
  amount: number;
  submittedAt: string;
  status: PaymentStatus;
};
export type Shipment = {
  id: string;
  orderId: string;
  courier: string;
  trackingNumber: string;
  handedOverAt: string;
  status: "in-transit" | "out-for-delivery" | "delivered";
};
export type LiveSession = {
  id: string;
  title: string;
  scheduledAt: string;
  platform: "TikTok Live";
  hostId: string;
  itemIds: string[];
  promotionChannels: string[];
  status: "draft" | "published" | "completed";
};
export type Strategy = {
  id: string;
  month: string;
  content: string;
  authorId: string;
  recipientIds: string[];
};
