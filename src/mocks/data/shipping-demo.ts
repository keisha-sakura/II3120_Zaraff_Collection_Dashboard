import type { SalesState } from "@/features/penjualan/model";
import type { ShippingState } from "@/features/pengiriman/model";
/** Reconstructs packing metadata for existing packed/shipped demo orders only. */
export function ensureShippingRecords(
  source: ShippingState,
  sales: SalesState,
): ShippingState {
  const shipping = structuredClone(source);
  for (const order of sales.orders.filter((order) =>
    ["packed", "shipped", "completed"].includes(order.status),
  )) {
    if (shipping.packing.some((record) => record.orderId === order.id))
      continue;
    const knownLala = order.id === "ORD-261115-003";
    shipping.packing.push({
      orderId: order.id,
      checklist: {
        pickedItemIds: [...order.itemIds],
        codeMatches: true,
        conditionMatches: true,
        packed: true,
      },
      packedAt: knownLala
        ? "2026-11-22T10:00:00+07:00"
        : (order.shipment?.handedOverAt ?? order.createdAt),
      packedBy: knownLala ? "Rizky" : "Data sebelumnya",
    });
  }
  return shipping;
}
export function createShippingDemo(sales: SalesState) {
  return ensureShippingRecords({ version: 1, packing: [] }, sales);
}
