import type { SalesState } from "@/features/penjualan/model";
import type { WarehouseState } from "@/features/gudang/model";
import { daysSince } from "../gudang/model.ts";
const monthFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  timeZone: "Asia/Jakarta",
});
export function monthOf(date: string) {
  const parts = monthFormatter.formatToParts(new Date(date));
  return `${parts.find((part) => part.type === "year")!.value}-${parts.find((part) => part.type === "month")!.value}`;
}
export function soldRows(
  warehouse: WarehouseState,
  sales: SalesState,
  month: string,
) {
  return warehouse.items
    .filter((item) => item.soldAt && monthOf(item.soldAt) === month)
    .map((item) => {
      const order = sales.orders.find((order) =>
        order.itemIds.includes(item.id),
      );
      let price = item.price ?? 0;
      if (order) {
        // Allocate the saved net order total; the final line absorbs rupiah rounding.
        const index = order.lines.findIndex((line) => line.itemId === item.id);
        const subtotal = order.lines.reduce(
          (total, line) => total + line.price,
          0,
        );
        const allocated = order.lines.map((line) =>
          subtotal ? Math.floor((line.price / subtotal) * order.total) : 0,
        );
        if (allocated.length)
          allocated[allocated.length - 1] +=
            order.total -
            allocated.reduce((total, amount) => total + amount, 0);
        if (index >= 0) price = allocated[index];
      }
      return {
        ...item,
        netPrice: price,
        saleOrderId: order?.id ?? item.orderId,
      };
    })
    .sort((a, b) => b.soldAt!.localeCompare(a.soldAt!));
}
export function ageBuckets(
  warehouse: WarehouseState,
  reference = new Date().toISOString(),
) {
  const counts = [0, 0, 0, 0];
  for (const item of warehouse.items.filter(
    (item) => item.status === "available" && item.availableAt,
  )) {
    const days = daysSince(item.availableAt!, reference);
    counts[days <= 30 ? 0 : days <= 60 ? 1 : days <= 90 ? 2 : 3]++;
  }
  return ["0–30 hari", "31–60 hari", "61–90 hari", "> 90 hari"].map(
    (label, index) => ({ label, value: counts[index] }),
  );
}
export function reportData(
  warehouse: WarehouseState,
  sales: SalesState,
  month: string,
) {
  const sold = soldRows(warehouse, sales, month);
  const categories = [...new Set(sold.map((item) => item.category))]
    .sort()
    .map((category) => ({
      category,
      count: sold.filter((item) => item.category === category).length,
      revenue: sold
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + item.netPrice, 0),
    }));
  // Available + reserved at month end reconstructed from recorded availability and sale dates.
  const closing = warehouse.history
    ? warehouse.items.flatMap((item) => {
        const [year, number] = month.split("-").map(Number);
        const cutoff = Date.UTC(year, number, 1) - 7 * 3600000;
        const latest = warehouse
          .history!.filter(
            (row) =>
              row.itemId === item.id && Date.parse(row.occurredAt) < cutoff,
          )
          .sort(
            (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
          )[0];
        return latest && ["available", "reserved"].includes(latest.status)
          ? [
              {
                ...item,
                grade: latest.grade as typeof item.grade,
                price: latest.price,
              },
            ]
          : [];
      })
    : warehouse.items.filter(
        (item) =>
          item.availableAt &&
          monthOf(item.availableAt) <= month &&
          (!item.soldAt || monthOf(item.soldAt) > month) &&
          !["returned", "written-off"].includes(item.status),
      );
  return {
    sold,
    categories,
    revenue: sold.reduce((sum, item) => sum + item.netPrice, 0),
    returns: warehouse.returns.filter((row) => monthOf(row.createdAt) === month)
      .length,
    closing,
    grades: ["A", "B", "C"].map((grade) => ({
      grade,
      count: closing.filter((item) => item.grade === grade).length,
    })),
  };
}
