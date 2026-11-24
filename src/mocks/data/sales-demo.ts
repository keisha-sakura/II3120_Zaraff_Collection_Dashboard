import type { SalesState, SalesOrder } from "@/features/penjualan/model";
import type { WarehouseState, WarehouseItem } from "@/features/gudang/model";

/** Adds only absent demo SKUs. Existing warehouse edits remain untouched. */
export function createSalesDemo(source: WarehouseState): {
  sales: SalesState;
  warehouse: WarehouseState;
} {
  const warehouse = structuredClone(source);
  const template =
    warehouse.items.find((item) => item.id === "ZR-2610-0013") ??
    warehouse.items[0];
  const extra: WarehouseItem[] = [
    {
      ...template,
      id: "ZR-2609-0008",
      baleId: "BL-260926-001",
      category: "Hoodie",
      grade: "B",
      condition: "Baik (cacat minor)",
      price: 115000,
      status: "available",
      locationId: "R02-S01",
      availableAt: "2026-09-27T09:00:00+07:00",
      sortedAt: "2026-09-26T10:00:00+07:00",
      laundryAt: "2026-09-26T10:00:00+07:00",
      soldAt: null,
      outboundAt: null,
      orderId: null,
    },
    {
      ...template,
      id: "ZR-2610-0012",
      grade: "B",
      price: 65000,
      status: "sold",
      soldAt: "2026-11-18T09:00:00+07:00",
      outboundAt: null,
      orderId: "ORD-261115-003",
    },
    {
      ...template,
      id: "ZR-2610-0016",
      category: "Dress",
      grade: "A",
      price: 130000,
      status: "outbound",
      locationId: null,
      soldAt: "2026-11-17T09:00:00+07:00",
      outboundAt: "2026-11-21T15:00:00+07:00",
      orderId: "ORD-261115-002",
    },
    {
      ...template,
      id: "ZR-2610-0017",
      category: "Rok",
      grade: "B",
      price: 70000,
      status: "sold",
      locationId: "R02-S02",
      soldAt: "2026-11-23T09:00:00+07:00",
      outboundAt: null,
      orderId: "ORD-261121-002",
    },
  ];
  for (const item of extra)
    if (!warehouse.items.some((existing) => existing.id === item.id))
      warehouse.items.push(item);
  const customers: SalesState["customers"] = [
    {
      id: "customer-rina",
      name: "Rina Marlina",
      handle: "@rina.thrift",
      phone: "0812-3456-7781",
      isMember: true,
      depositBalance: 200000,
      joinedAt: "2026-08-01T00:00:00+07:00",
    },
    {
      id: "customer-dodi",
      name: "Dodi Pratama",
      handle: "@dodi_ootd",
      phone: "0813-2222-1904",
      isMember: false,
      depositBalance: 0,
      joinedAt: "2026-09-01T00:00:00+07:00",
    },
    {
      id: "customer-sari",
      name: "Sari Wulandari",
      handle: "@sarivintage",
      phone: "0857-1100-2231",
      isMember: true,
      depositBalance: 0,
      joinedAt: "2026-08-01T00:00:00+07:00",
    },
    {
      id: "customer-mega",
      name: "Mega Ayu",
      handle: "@mega.preloved",
      phone: "0821-7788-1200",
      isMember: false,
      depositBalance: 0,
      joinedAt: "2026-08-01T00:00:00+07:00",
    },
    {
      id: "customer-fajar",
      name: "Fajar Nugraha",
      handle: "@fajarkoleksi",
      phone: "0811-9090-4545",
      isMember: true,
      depositBalance: 315500,
      joinedAt: "2026-08-01T00:00:00+07:00",
    },
    {
      id: "customer-lala",
      name: "Lala",
      handle: "@lalaa.style",
      phone: "0812-9900-1100",
      isMember: false,
      depositBalance: 0,
      joinedAt: "2026-09-01T00:00:00+07:00",
    },
  ];
  const order = (
    id: string,
    customerId: string,
    itemId: string,
    status: SalesOrder["status"],
    memberDiscount: number,
    liveId: string,
  ): SalesOrder => {
    const item = warehouse.items.find((item) => item.id === itemId)!;
    const price = item.price!;
    return {
      id,
      customerId,
      itemIds: [itemId],
      createdAt: id.includes("261115")
        ? "2026-11-15T20:00:00+07:00"
        : "2026-11-21T20:00:00+07:00",
      subtotal: price,
      memberDiscount,
      total: price - memberDiscount,
      status,
      liveId,
      lines: [{ itemId, category: item.category, grade: item.grade!, price }],
      paymentStatus: status === "awaiting-payment" ? "unpaid" : "approved",
      shipment: null,
    };
  };
  const orders = [
    order(
      "ORD-261121-004",
      "customer-mega",
      "ZR-2610-0015",
      "awaiting-payment",
      0,
      "live-261121",
    ),
    order(
      "ORD-261121-003",
      "customer-sari",
      "ZR-2610-0013",
      "awaiting-payment",
      6500,
      "live-261121",
    ),
    order(
      "ORD-261121-002",
      "customer-fajar",
      "ZR-2610-0017",
      "paid",
      7000,
      "live-261121",
    ),
    order(
      "ORD-261121-001",
      "customer-dodi",
      "ZR-2610-0011",
      "paid",
      0,
      "live-261121",
    ),
    order(
      "ORD-261115-003",
      "customer-lala",
      "ZR-2610-0012",
      "packed",
      0,
      "live-261115",
    ),
    order(
      "ORD-261115-002",
      "customer-mega",
      "ZR-2610-0016",
      "shipped",
      0,
      "live-261115",
    ),
  ];
  orders[1].paymentStatus = "pending";
  orders[5].shipment = {
    id: "shipment-mega",
    orderId: orders[5].id,
    courier: "J&T Express",
    trackingNumber: "JX2299877120",
    handedOverAt: "2026-11-21T15:00:00+07:00",
    status: "in-transit",
    events: [
      {
        title: "Dalam Perjalanan",
        dateTime: "2026-11-22T09:00:00+07:00",
        description: "Hub Jakarta",
      },
      {
        title: "Diserahkan ke Kurir",
        dateTime: "2026-11-21T15:00:00+07:00",
        description: "J&T Express",
      },
    ],
  };
  for (const sale of orders) {
    const item = warehouse.items.find((item) => item.id === sale.itemIds[0]);
    if (item && !item.orderId) item.orderId = sale.id;
  }
  const live = (
    id: string,
    title: string,
    scheduledAt: string,
    itemIds: string[],
    status: "draft" | "published" | "completed",
    processed = false,
  ): SalesState["lives"][number] => ({
    id,
    title,
    scheduledAt,
    itemIds,
    status,
    hostId: "user-host",
    platform: "TikTok Live",
    promotionChannels: ["Instagram", "TikTok"],
    content:
      "Koleksi pilihan Zaraff. Catat jadwal live dan temukan barang favoritmu!",
    claimsProcessed: processed,
    results: [],
  });
  const lives = [
    live(
      "live-261128",
      "Live Sabtu: Jaket dan Hoodie",
      "2026-11-28T19:00:00+07:00",
      ["ZR-2609-0008", "ZR-2609-0009", "ZR-2609-0010"],
      "draft",
    ),
    live(
      "live-261201",
      "Live Selasa: Kaos Vintage",
      "2026-12-01T19:00:00+07:00",
      ["ZR-2608-0001"],
      "published",
    ),
    live(
      "live-261121",
      "Live Jumat Malam",
      "2026-11-21T19:00:00+07:00",
      ["ZR-2610-0011", "ZR-2610-0013", "ZR-2610-0015", "ZR-2610-0017"],
      "completed",
      true,
    ),
    live(
      "live-261115",
      "Live Kemeja Kantor",
      "2026-11-15T19:00:00+07:00",
      ["ZR-2610-0012", "ZR-2610-0016"],
      "completed",
      true,
    ),
    live(
      "live-261123",
      "Live Senin Sore",
      "2026-11-23T19:00:00+07:00",
      ["ZR-2609-0008", "ZR-2609-0009", "ZR-2610-0013"],
      "completed",
    ),
  ];
  for (const session of lives.filter((session) => session.claimsProcessed))
    session.results = orders
      .filter((sale) => sale.liveId === session.id)
      .map((sale, index) => ({
        id: `seed-claim-${sale.id}`,
        line: index + 1,
        handle: customers.find((customer) => customer.id === sale.customerId)!
          .handle,
        itemCode: sale.itemIds[0],
        time: `19:2${index}:00.000`,
        milliseconds: (19 * 3600 + (20 + index) * 60) * 1000,
        error: null,
        outcome: "won",
        reason: "Pembeli tercepat",
        orderId: sale.id,
      }));
  return {
    warehouse,
    sales: {
      version: 1,
      customers,
      orders,
      lives,
      draft: null,
      memberDiscountPercent: 10,
      deposits: [
        {
          id: "deposit-fajar-1",
          customerId: "customer-fajar",
          occurredAt: "2026-11-23T09:00:00+07:00",
          description: "ORD-261121-002",
          amount: -63000,
        },
        {
          id: "deposit-fajar-2",
          customerId: "customer-fajar",
          occurredAt: "2026-10-29T09:00:00+07:00",
          description: "ORD-261025-001",
          amount: -121500,
        },
      ],
    },
  };
}
