import type { WarehouseItem, WarehouseState } from "@/features/gudang/model";
import type { Grade, ItemCategory } from "@/types/domain";
import { mockBales, mockItems, mockLocations } from "./warehouse.ts";

export const mockPriceRules: Record<ItemCategory, Record<Grade, number>> = {
  Kemeja: { A: 85000, B: 65000, C: 45000 },
  Kaos: { A: 60000, B: 45000, C: 30000 },
  Celana: { A: 100000, B: 75000, C: 60000 },
  Hoodie: { A: 150000, B: 115000, C: 85000 },
  Jaket: { A: 180000, B: 130000, C: 90000 },
  Dress: { A: 130000, B: 100000, C: 75000 },
  Rok: { A: 90000, B: 70000, C: 50000 },
};
const extraItem = (
  id: string,
  category: ItemCategory,
  grade: Grade,
  price: number,
  locationId: string,
): WarehouseItem => ({
  id,
  category,
  grade,
  price,
  locationId,
  baleId: "BL-261030-001",
  condition:
    grade === "A"
      ? "Sangat baik (tanpa cacat)"
      : grade === "B"
        ? "Baik (cacat minor)"
        : "Layak (cacat terlihat)",
  status: "available",
  availableAt: "2026-11-03T14:08:00+07:00",
  soldAt: null,
  outboundAt: null,
  sortedAt: "2026-10-31T10:17:00+07:00",
  sortedBy: "Jojo",
  laundryAt: "2026-10-31T10:17:00+07:00",
  orderId: null,
});

export function createWarehouseDemo(): WarehouseState {
  const items: WarehouseItem[] = mockItems.map((item) => ({
    ...item,
    sortedAt:
      item.status === "laundry"
        ? "2026-11-20T09:00:00+07:00"
        : "2026-10-31T10:17:00+07:00",
    sortedBy: "Jojo",
    laundryAt:
      item.status === "laundry"
        ? "2026-11-20T09:00:00+07:00"
        : "2026-10-31T10:17:00+07:00",
    orderId:
      item.id === "ZR-2610-0013"
        ? "ORD-261121-003"
        : item.id === "ZR-2610-0011"
          ? "ORD-261121-001"
          : null,
  }));
  items.push(
    extraItem("ZR-2611-0024", "Kemeja", "A", 85000, "R01-S01"),
    {
      ...extraItem("ZR-2610-0015", "Kaos", "B", 45000, "R01-S02"),
      status: "reserved",
    },
    {
      ...extraItem("ZR-2609-0009", "Hoodie", "B", 115000, "R02-S01"),
      baleId: "BL-260926-001",
      sortedAt: "2026-09-26T10:00:00+07:00",
      laundryAt: "2026-09-26T10:00:00+07:00",
      availableAt: "2026-09-27T10:00:00+07:00",
    },
    {
      ...extraItem("ZR-2609-0010", "Jaket", "C", 90000, "R02-S01"),
      baleId: "BL-260926-001",
      sortedAt: "2026-09-26T10:00:00+07:00",
      laundryAt: "2026-09-26T10:00:00+07:00",
      availableAt: "2026-09-27T10:00:00+07:00",
    },
    {
      ...extraItem("ZR-2608-0001", "Kaos", "A", 60000, "R01-S02"),
      availableAt: "2026-08-01T09:00:00+07:00",
      baleId: "BL-260731-001",
      sortedAt: "2026-07-31T10:00:00+07:00",
      laundryAt: "2026-07-31T10:00:00+07:00",
    },
  );
  for (const [id, category, condition, sentAt] of [
    ["ZR-2611-0021", "Kaos", "Baik (cacat minor)", "2026-11-20T09:00:00+07:00"],
    [
      "ZR-2611-0022",
      "Celana",
      "Baik (cacat minor)",
      "2026-11-21T09:00:00+07:00",
    ],
    ["ZR-2611-0023", "Kaos", "Baik (cacat minor)", "2026-11-22T09:00:00+07:00"],
  ] as const)
    items.push({
      ...items[3],
      id,
      category,
      condition,
      sortedAt: sentAt,
      laundryAt: sentAt,
    });
  const bales = [
    {
      id: "BL-261122-001",
      supplier: "UD Thrift Import",
      category: "Celana Jeans",
      weightKg: 55,
      estimatedItems: 70,
      receivedAt: "2026-11-22T09:00:00+07:00",
      locationId: "BL-A02",
      status: "stored" as const,
      receivedBy: "Jojo",
    },
    {
      id: "BL-261121-001",
      supplier: "PT Sandang Second",
      category: "Dress dan Rok",
      weightKg: 35,
      estimatedItems: 60,
      receivedAt: "2026-11-21T09:00:00+07:00",
      locationId: "BL-A01",
      status: "stored" as const,
      receivedBy: "Jojo",
    },
    ...mockBales.map((bale) => ({ ...bale, receivedBy: "Jojo" })),
    {
      id: "BL-260731-001",
      supplier: "CV Bale Jaya",
      category: "Kaos Campur",
      weightKg: 40,
      estimatedItems: 50,
      receivedAt: "2026-07-31T09:00:00+07:00",
      locationId: null,
      status: "sorted" as const,
      receivedBy: "Jojo",
    },
    {
      id: "BL-260926-001",
      supplier: "UD Thrift Import",
      category: "Jaket dan Hoodie",
      weightKg: 50,
      estimatedItems: 50,
      receivedAt: "2026-09-26T09:00:00+07:00",
      locationId: null,
      status: "sorted" as const,
      receivedBy: "Jojo",
    },
  ];
  return {
    version: 1,
    bales,
    items,
    locations: [
      ...mockLocations,
      {
        id: "R01-S03",
        code: "R01-S03",
        description: "Rak 1 susun 3 · Celana",
        kind: "rack",
      },
      {
        id: "R02-S01",
        code: "R02-S01",
        description: "Rak 2 susun 1 · Jaket dan hoodie",
        kind: "rack",
      },
      {
        id: "R02-S03",
        code: "R02-S03",
        description: "Rak 2 susun 3 · Cadangan",
        kind: "rack",
      },
    ],
    returns: [1, 2, 3, 4].map((number) => ({
      id: `RT-261121-00${number}`,
      baleId: number === 1 ? "BL-261119-001" : "BL-261030-001",
      category: "Kaos",
      condition: "Tidak Layak (cacat terlihat)",
      reason: "Bolong di bagian ketiak",
      createdAt: "2026-11-21T10:00:00+07:00",
      createdBy: "Jojo",
    })),
    movements: [
      ...bales.flatMap((bale) => [
        {
          id: `received-${bale.id}`,
          entityId: bale.id,
          occurredAt: bale.receivedAt,
          action: "Bale diterima",
          from: "—",
          to: "Di Gudang",
          actor: bale.receivedBy,
        },
        ...(bale.locationId
          ? [
              {
                id: `location-${bale.id}`,
                entityId: bale.id,
                occurredAt: bale.receivedAt,
                action: "Lokasi ditetapkan",
                from: "—",
                to: bale.locationId,
                actor: bale.receivedBy,
              },
            ]
          : []),
      ]),
      ...items.flatMap((item) => [
        {
          id: `sorted-${item.id}`,
          entityId: item.id,
          occurredAt: item.sortedAt,
          action: "Hasil sortir, ke laundry",
          from: "—",
          to: "Di Laundry",
          actor: "Jojo",
        },
        ...(item.availableAt
          ? [
              {
                id: `graded-${item.id}`,
                entityId: item.id,
                occurredAt: item.availableAt,
                action: "Selesai laundry dan grading",
                from: "Di Laundry",
                to: "Tersedia",
                actor: "Jojo",
              },
              {
                id: `located-${item.id}`,
                entityId: item.id,
                occurredAt: item.availableAt,
                action: "Lokasi ditetapkan",
                from: "—",
                to: item.locationId ?? "—",
                actor: "Jojo",
              },
            ]
          : []),
        ...(item.status === "reserved"
          ? [
              {
                id: `reserved-${item.id}`,
                entityId: item.id,
                occurredAt: "2026-11-21T20:00:00+07:00",
                action: "Reservasi dari klaim live",
                from: "Tersedia",
                to: "Dipesan",
                actor: "Nadia",
              },
            ]
          : []),
      ]),
    ],
  };
}
