import { createWarehouseDemo } from "../mocks/data/warehouse-demo.ts";
import { createSalesDemo } from "../mocks/data/sales-demo.ts";
import { createPaymentsDemo } from "../mocks/data/payments-demo.ts";
import { createShippingDemo } from "../mocks/data/shipping-demo.ts";
import { createSettingsDemo } from "../mocks/data/settings-demo.ts";
import type { Workspace } from "../types/workspace";

/** A small, connected starting dataset; the full demo remains a test fixture. */
export function createSmallWorkspace(): Workspace {
  const { warehouse, sales } = createSalesDemo(createWarehouseDemo());
  const orderIds = ["ORD-261121-004", "ORD-261121-001", "ORD-261115-002"];
  sales.orders = sales.orders.filter((order) => orderIds.includes(order.id));
  sales.customers = sales.customers.filter(
    (customer) =>
      customer.id === "customer-rina" ||
      sales.orders.some((order) => order.customerId === customer.id),
  );
  sales.deposits = [];
  sales.draft = null;
  const stockIds = [
    "ZR-2610-0014",
    "ZR-2611-0024",
    "ZR-2609-0008",
    "ZR-2611-0020",
    "ZR-2611-0021",
  ];
  warehouse.items = warehouse.items.filter(
    (item) =>
      stockIds.includes(item.id) ||
      sales.orders.some((order) => order.itemIds.includes(item.id)),
  );
  warehouse.bales = [
    {
      ...warehouse.bales[0],
      id: "BL-261119-001",
      supplier: "CV Bale Jaya",
      category: "Pakaian Campur",
      weightKg: 5,
      estimatedItems: 8,
      receivedAt: "2026-11-19T09:00:00+07:00",
      locationId: null,
      status: "sorted",
      receivedBy: "Jojo",
    },
    {
      ...warehouse.bales[0],
      id: "BL-261124-001",
      supplier: "CV Bale Jaya",
      category: "Kaos Campur",
      weightKg: 12,
      estimatedItems: 20,
      receivedAt: "2026-11-24T09:00:00+07:00",
      locationId: "BL-A01",
      status: "stored",
      receivedBy: "Jojo",
    },
  ];
  warehouse.locations = warehouse.locations.filter((location) =>
    ["BL-A01", "R01-S01", "R01-S02"].includes(location.id),
  );
  warehouse.returns = [];
  warehouse.movements = [];
  for (const item of warehouse.items) {
    item.baleId = "BL-261119-001";
    item.sortedAt = "2026-11-20T09:00:00+07:00";
    item.laundryAt = item.sortedAt;
    item.availableAt =
      item.status === "laundry" ? null : "2026-11-21T10:00:00+07:00";
    item.locationId =
      item.status === "outbound" || item.status === "laundry"
        ? null
        : "R01-S01";
    item.soldAt = null;
    item.outboundAt = null;
    item.orderId = null;
  }
  const liveId = "live-small-261121";
  for (const order of sales.orders) {
    order.liveId = liveId;
    order.createdAt = "2026-11-21T20:00:00+07:00";
    const item = warehouse.items.find((item) => item.id === order.itemIds[0])!;
    item.orderId = order.id;
    if (order.paymentStatus === "approved")
      item.soldAt = "2026-11-22T09:00:00+07:00";
    if (order.shipment) {
      order.shipment.handedOverAt = "2026-11-23T15:00:00+07:00";
      order.shipment.events = [
        {
          title: "Diserahkan ke kurir",
          dateTime: order.shipment.handedOverAt,
          description: "Paket diterima J&T Express dari Keisha.",
        },
      ];
      item.outboundAt = order.shipment.handedOverAt;
    }
  }
  const template = sales.lives[0];
  sales.lives = [
    {
      ...template,
      id: liveId,
      title: "Live Sabtu Koleksi Pilihan",
      scheduledAt: "2026-11-21T19:00:00+07:00",
      status: "completed",
      itemIds: sales.orders.flatMap((order) => order.itemIds),
      claimsProcessed: true,
      results: sales.orders.map((order, index) => ({
        id: `small-claim-${index}`,
        line: index + 1,
        handle: sales.customers.find(
          (customer) => customer.id === order.customerId,
        )!.handle,
        itemCode: order.itemIds[0],
        time: `19:2${index}:00.000`,
        milliseconds: (19 * 3600 + (20 + index) * 60) * 1000,
        error: null,
        outcome: "won",
        reason: "Pembeli tercepat",
        orderId: order.id,
      })),
    },
    {
      ...template,
      id: "live-small-261128",
      title: "Live Sabtu Stok Baru",
      scheduledAt: "2026-11-28T19:00:00+07:00",
      status: "published",
      itemIds: warehouse.items
        .filter((item) => item.status === "available")
        .map((item) => item.id),
      claimsProcessed: false,
      results: [],
    },
  ];
  // Paid examples use a real deposit ledger, without imaginary transfer uploads.
  for (const customer of sales.customers) {
    const paid = sales.orders.filter(
      (order) =>
        order.customerId === customer.id && order.paymentStatus === "approved",
    );
    const spent = paid.reduce((sum, order) => sum + order.total, 0);
    const opening = spent ? spent + 50000 : 0;
    customer.depositBalance = opening - spent;
    if (opening)
      sales.deposits.push({
        id: `small-opening-${customer.id}`,
        customerId: customer.id,
        amount: opening,
        description: "Top up saldo awal",
        occurredAt: "2026-11-21T12:00:00+07:00",
      });
    for (const order of paid)
      sales.deposits.push({
        id: `small-payment-${order.id}`,
        customerId: customer.id,
        amount: -order.total,
        description: order.id,
        occurredAt: "2026-11-22T09:00:00+07:00",
      });
  }
  const data = createPaymentsDemo(sales, warehouse);
  for (const attempt of data.payments.attempts) {
    attempt.method = "deposit";
    attempt.proof = null;
    attempt.submittedAt = "2026-11-22T09:00:00+07:00";
    attempt.reviewedAt = attempt.submittedAt;
    attempt.balanceBefore = attempt.amount + 50000;
    attempt.balanceAfter = 50000;
  }
  const shipping = createShippingDemo(data.sales);
  for (const record of shipping.packing) {
    record.packedAt = "2026-11-23T10:00:00+07:00";
    record.packedBy = "Rizky";
  }
  return {
    version: 1,
    ...data,
    shipping,
    reports: { version: 1, strategies: [] },
    settings: createSettingsDemo(),
  };
}
