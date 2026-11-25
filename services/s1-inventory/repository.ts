import { db, type DbTransaction } from "@backend/lib/db";

type Writer = typeof db | DbTransaction;
const client = (tx?: Writer) => tx ?? db;

export const locationRepository = {
  list: () => db.location.findMany({ orderBy: { kode: "asc" } }),
  find: (id: string) => db.location.findUnique({ where: { id } }),
  create: (data: { kode: string; deskripsi: string }, tx?: Writer) =>
    client(tx).location.create({ data }),
  update: (
    id: string,
    data: { kode?: string; deskripsi?: string },
    tx?: Writer,
  ) => client(tx).location.update({ where: { id }, data }),
};
export const baleRepository = {
  find: (id: string) =>
    db.bale.findUnique({ where: { id }, include: { location: true } }),
  create: (
    data: {
      supplier: string;
      jenis: string;
      beratKg: number;
      jumlahItem: number;
      tanggalTerima: Date;
      locationId: string;
    },
    tx?: Writer,
  ) =>
    client(tx).bale.create({
      data: { ...data, status: "di gudang" },
      include: { location: true },
    }),
  updateStatus: (id: string, status: string, tx?: Writer) =>
    client(tx).bale.update({ where: { id }, data: { status } }),
  list: (where: Record<string, unknown>) =>
    db.bale.findMany({
      where,
      include: { location: true, _count: { select: { items: true } } },
      orderBy: { tanggalTerima: "desc" },
    }),
  countByStatus: (status: string) => db.bale.count({ where: { status } }),
  detail: (id: string) =>
    db.bale.findUnique({
      where: { id },
      include: { location: true, items: true },
    }),
  countItems: (baleId: string, tx?: Writer) =>
    client(tx).item.count({ where: { baleId } }),
  updateLocation: (id: string, locationId: string, tx?: Writer) =>
    client(tx).bale.update({
      where: { id },
      data: { locationId },
      include: { location: true },
    }),
};
export const itemRepository = {
  reserve: (id: string, orderId: string, tx: DbTransaction) =>
    tx.item.updateMany({
      where: { id, status: "tersedia", locationId: { not: null } },
      data: { status: "dipesan", orderId },
    }),
  findById: (id: string, tx?: Writer) =>
    client(tx).item.findUnique({
      where: { id },
      include: { bale: true, location: true },
    }),
  findByKode: (kode: string) =>
    db.item.findUnique({
      where: { kode },
      include: { bale: true, location: true },
    }),
  findByKodeIn: (kode: string, tx?: Writer) =>
    client(tx).item.findUnique({
      where: { kode },
      include: { bale: true, location: true },
    }),
  create: (
    data: {
      kode: string;
      baleId: string;
      kategori: string;
      kondisi: string;
      status: string;
      alasanRetur?: string;
      laundrySejak: Date;
    },
    tx?: Writer,
  ) => client(tx).item.create({ data }),
  update: (id: string, data: Record<string, unknown>, tx?: Writer) =>
    client(tx).item.update({ where: { id }, data }),
  count: (where: Record<string, unknown>) => db.item.count({ where }),
  countAll: (tx?: Writer) => client(tx).item.count(),
  list: (where: Record<string, unknown>, skip: number, take: number) =>
    db.item.findMany({
      where,
      skip,
      take,
      include: { location: true, bale: true },
      orderBy: { createdAt: "desc" },
    }),
  laundry: () =>
    db.item.findMany({
      where: { status: "di laundry" },
      include: { bale: true },
      orderBy: { laundrySejak: "asc" },
    }),
  withLocationIn: (locationIds: string[], tx?: Writer) =>
    client(tx).item.findMany({
      where: { locationId: { in: locationIds } },
      include: { location: true },
    }),
  shippedOut: (dari?: Date, sampai?: Date) =>
    db.item.findMany({
      where: {
        status: "keluar gudang",
        ...(dari || sampai
          ? {
              keluarGudangPada: {
                ...(dari ? { gte: dari } : {}),
                ...(sampai ? { lte: sampai } : {}),
              },
            }
          : {}),
      },
      orderBy: { keluarGudangPada: "desc" },
    }),
  allWithLocation: () => db.item.findMany({ include: { location: true } }),
};
export const movementRepository = {
  create: (
    data: {
      objekTipe: string;
      objekId: string;
      tipe: string;
      nilaiLama?: string | null;
      nilaiBaru: string;
      userId: string;
      baleId?: string;
      orderId?: string;
      stockCountId?: string;
    },
    tx?: Writer,
  ) => client(tx).stockMovement.create({ data }),
  list: (objekTipe?: string, objekId?: string) =>
    db.stockMovement.findMany({
      where: {
        ...(objekTipe ? { objekTipe } : {}),
        ...(objekId ? { objekId } : {}),
      },
      orderBy: { waktu: "asc" },
    }),
};
export const stockCountRepository = {
  create: (locationIds: string[], dibuatOleh: string, tx?: Writer) =>
    client(tx).stockCount.create({
      data: {
        status: "berjalan",
        dibuatOleh,
        locations: {
          create: locationIds.map((locationId) => ({ locationId })),
        },
      },
      include: { locations: { include: { location: true } } },
    }),
  detail: (id: string, tx?: Writer) =>
    client(tx).stockCount.findUnique({
      where: { id },
      include: {
        locations: { include: { location: true } },
        foundItems: { include: { location: true } },
      },
    }),
  addFoundItem: (
    stockCountId: string,
    kodeItem: string,
    locationId: string,
    tx?: Writer,
  ) =>
    client(tx).stockCountItem.create({
      data: { stockCountId, kodeItem, locationId },
      include: { location: true },
    }),
  update: (
    id: string,
    data: {
      status?: string;
      waktuSubmit?: Date;
      waktuSetuju?: Date;
      disetujuiOleh?: string;
    },
    tx?: Writer,
  ) => client(tx).stockCount.update({ where: { id }, data }),
};
