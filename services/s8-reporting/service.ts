import { inventoryService } from "@backend/services/s1-inventory/service";
import { orderService } from "@backend/services/s2-order/service";
import { paymentService } from "@backend/services/s4-payment/service";
import { shipmentService } from "@backend/services/s5-shipment/service";
import { monthSchema } from "./schemas";
import type { Period, StockReport, SalesReport, OverviewReport } from "./types";

function within(date: Date | null, period: Period): boolean {
  return (
    date !== null &&
    (!period.dari || date >= period.dari) &&
    (!period.sampai || date <= period.sampai)
  );
}

function gradeCounts(
  items: readonly { grade: string | null }[],
): Record<string, number> {
  return Object.fromEntries(
    ["A", "B", "C"].map((grade) => [
      grade,
      items.filter((item) => item.grade === grade).length,
    ]),
  );
}

/** Calendar month in WIB; the upper bound is the last millisecond of that month. */
function monthPeriod(bulan: string): Period {
  monthSchema.parse(bulan);
  const [year, month] = bulan.split("-").map(Number);
  return {
    dari: new Date(Date.UTC(year, month - 1, 1) - 7 * 3_600_000),
    sampai: new Date(Date.UTC(year, month, 1) - 7 * 3_600_000 - 1),
  };
}

export const reportingService = {
  async stock(): Promise<StockReport> {
    const items = await inventoryService.reportItems();
    const statuses = [...new Set(items.map((item) => item.status))];
    return {
      total: items.length,
      perStatus: Object.fromEntries(
        statuses.map((status) => [
          status,
          items.filter((item) => item.status === status).length,
        ]),
      ),
      perGrade: gradeCounts(items.filter((item) => item.status === "tersedia")),
      items,
    };
  },
  async overview(period: Period): Promise<OverviewReport> {
    const [items, orders, payments, shipments] = await Promise.all([
      inventoryService.reportItems(),
      orderService.list({}),
      paymentService.listPayments(),
      shipmentService.list(),
    ]);
    const sold = items.filter((item) => within(item.terjualPada, period));
    const soldOrderIds = new Set(sold.map((item) => item.orderId));
    return {
      penjualan: sold.length,
      pendapatan: orders
        .filter((order) => soldOrderIds.has(order.id))
        .reduce((total, order) => total + order.total, 0),
      stokTersedia: items.filter((item) => item.status === "tersedia").length,
      pesananAktif: orders.filter(
        (order) =>
          order.status !== "selesai" && within(order.dibuatPada, period),
      ).length,
      pembayaranMenungguValidasi: payments.filter(
        (payment) =>
          payment.status === "menunggu validasi" &&
          within(payment.waktu, period),
      ).length,
      pengirimanBerjalan: shipments.filter(
        (shipment) =>
          shipment.status !== "diterima" &&
          within(shipment.diperbaruiPada, period),
      ).length,
    };
  },
  async sales(bulan: string): Promise<SalesReport> {
    const period = monthPeriod(bulan);
    const [items, orders, keluarGudang] = await Promise.all([
      inventoryService.reportItems(),
      orderService.list({}),
      inventoryService.shippedOut(period.dari, period.sampai),
    ]);
    const itemTerjual = items.filter((item) =>
      within(item.terjualPada, period),
    );
    const ids = new Set(itemTerjual.map((item) => item.orderId));
    return {
      bulan,
      jumlahItemTerjual: itemTerjual.length,
      pendapatan: orders
        .filter((order) => ids.has(order.id))
        .reduce((total, order) => total + order.total, 0),
      jumlahRetur: items.filter(
        (item) => item.status === "diretur" && within(item.createdAt, period),
      ).length,
      stokPerGrade: gradeCounts(
        items.filter((item) => item.status === "tersedia"),
      ),
      jumlahKeluarGudang: keluarGudang.length,
      itemTerjual,
      keluarGudang,
    };
  },
  salesCsv(report: SalesReport): string {
    const rows: (string | number)[][] = [
      [
        "bulan",
        "item_terjual",
        "pendapatan",
        "retur",
        "stok_A",
        "stok_B",
        "stok_C",
        "keluar_gudang",
      ],
      [
        report.bulan,
        report.jumlahItemTerjual,
        report.pendapatan,
        report.jumlahRetur,
        report.stokPerGrade.A,
        report.stokPerGrade.B,
        report.stokPerGrade.C,
        report.jumlahKeluarGudang,
      ],
    ];
    return (
      rows
        .map((row) =>
          row
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(","),
        )
        .join("\r\n") + "\r\n"
    );
  },
};
