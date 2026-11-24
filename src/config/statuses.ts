import type { BadgeTone } from "@/components/ui/badge";
import type {
  BaleStatus,
  ItemStatus,
  OrderStatus,
  PaymentStatus,
  Shipment,
} from "@/types/domain";
type StatusDefinition = { label: string; tone: BadgeTone };
export const itemStatuses: Record<ItemStatus, StatusDefinition> = {
  laundry: { label: "Di Laundry", tone: "info" },
  available: { label: "Tersedia", tone: "success" },
  reserved: { label: "Dipesan", tone: "warning" },
  sold: { label: "Terjual", tone: "sold" },
  outbound: { label: "Keluar Gudang", tone: "neutral" },
  returned: { label: "Diretur", tone: "danger" },
  "written-off": { label: "Dihapusbukukan", tone: "neutral" },
};
export const baleStatuses: Record<BaleStatus, StatusDefinition> = {
  stored: { label: "Di Gudang", tone: "neutral" },
  sorting: { label: "Sedang Disortir", tone: "warning" },
  sorted: { label: "Selesai Disortir", tone: "success" },
};
export const orderStatuses: Record<OrderStatus, StatusDefinition> = {
  "awaiting-payment": { label: "Menunggu Pembayaran", tone: "warning" },
  paid: { label: "Lunas", tone: "success" },
  packed: { label: "Dikemas", tone: "info" },
  shipped: { label: "Dikirim", tone: "info" },
  completed: { label: "Selesai", tone: "success" },
};
export const paymentStatuses: Record<PaymentStatus, StatusDefinition> = {
  pending: { label: "Menunggu Validasi", tone: "warning" },
  approved: { label: "Disetujui", tone: "success" },
  rejected: { label: "Ditolak", tone: "danger" },
};

export const shippingStatuses: Record<Shipment["status"], StatusDefinition> = {
  "in-transit": { label: "Dalam Perjalanan", tone: "info" },
  "out-for-delivery": { label: "Sedang Diantar", tone: "info" },
  delivered: { label: "Diterima Pembeli", tone: "success" },
};
