import type { SalesState } from "../penjualan/model";
import type { PaymentsState } from "./model";
import { invoiceIdForOrder } from "./model.ts";
export function ensureInvoices(
  source: PaymentsState,
  sales: SalesState,
): PaymentsState {
  const payments = structuredClone(source);
  for (const order of sales.orders) {
    if (!payments.invoices.some((invoice) => invoice.orderId === order.id)) {
      const id = invoiceIdForOrder(order.id);
      payments.invoices.push({
        id,
        orderId: order.id,
        createdAt: order.createdAt,
        events: [
          {
            id: `issued-${id}`,
            type: "issued",
            title: "Tagihan dikirim",
            message: `Tagihan ${id}: Rp ${order.total.toLocaleString("id-ID")}.`,
            occurredAt: order.createdAt,
            actor: "Sistem",
          },
        ],
      });
    }
  }
  return payments;
}
