import type { Location, Customer, PackingRecord } from "@prisma/client";
import type { orderService } from "@backend/services/s2-order/service";
import type { paymentService } from "@backend/services/s4-payment/service";
import type { ShipmentDetail } from "@backend/services/s5-shipment/types";
export type FulfillmentStage = "lunas" | "dikemas" | "dikirim" | "selesai";
export type PaymentInput = {
  metode: "transfer" | "deposit";
  buktiBayar?: string;
  jumlah?: number;
};
export type PackingOrder = {
  order: Awaited<ReturnType<typeof orderService.findById>>;
  items: { itemId: string; kode: string; location: Location }[];
};
export type OrderDetail = {
  order: PackingOrder["order"];
  customer: Customer;
  invoice: Awaited<ReturnType<typeof paymentService.invoiceForOrder>>;
  packing: PackingRecord | null;
  shipment: ShipmentDetail | null;
};
