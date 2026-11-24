import { db, type DbTransaction } from "@backend/lib/db";
import { errors } from "@backend/lib/errors";
import { baleRepository, itemRepository, locationRepository, movementRepository, stockCountRepository } from "./repository";
import type { Actor } from "./types";

const writeMovement = (data: Parameters<typeof movementRepository.create>[0], tx?: DbTransaction) => movementRepository.create(data, tx);
const requireLocation = async (id: string) => {
  const location = await locationRepository.find(id);
  if (!location) throw errors.tidakDitemukan("Lokasi tidak ditemukan");
  return location;
};
async function reconcile(stockCountId: string, tx?: DbTransaction) {
  const stockCount = await stockCountRepository.detail(stockCountId, tx);
  if (!stockCount) throw errors.tidakDitemukan("Opname stok tidak ditemukan");
  const locationIds = stockCount.locations.map((scope) => scope.locationId);
  const ditemukan = new Set(stockCount.foundItems.map((found) => found.kodeItem));
  const tercatat = await itemRepository.withLocationIn(locationIds, tx);
  const hilang = tercatat.filter((item) => !ditemukan.has(item.kode));
  const salahLokasi = [] as { item: Awaited<ReturnType<typeof itemRepository.findByKodeIn>>; ditemukanDi: (typeof stockCount.foundItems)[number] }[];
  for (const found of stockCount.foundItems) {
    const item = await itemRepository.findByKodeIn(found.kodeItem, tx);
    if (item && item.locationId !== found.locationId) salahLokasi.push({ item, ditemukanDi: found });
  }
  return { stockCount, hilang, salahLokasi };
}

export const inventoryService = {
  listLocations: () => locationRepository.list(),
  async createLocation(input: { kode: string; deskripsi: string }) { return locationRepository.create(input); },
  async updateLocation(id: string, input: { kode?: string; deskripsi?: string }) {
    await requireLocation(id); return locationRepository.update(id, input);
  },
  async createBale(input: { supplier: string; jenis: string; beratKg: number; jumlahItem: number; tanggalTerima: Date; locationId: string }, actor: Actor) {
    await requireLocation(input.locationId);
    return db.$transaction(async (tx) => {
      const bale = await baleRepository.create(input, tx);
      await writeMovement({ objekTipe: "bale", objekId: bale.id, tipe: "status", nilaiBaru: "di gudang", userId: actor.id, baleId: bale.id }, tx);
      return bale;
    });
  },
  async listBales(input: { status?: string; supplier?: string; tanggalDari?: Date; tanggalSampai?: Date }) {
    const tanggalTerima = input.tanggalDari || input.tanggalSampai ? { ...(input.tanggalDari ? { gte: input.tanggalDari } : {}), ...(input.tanggalSampai ? { lte: input.tanggalSampai } : {}) } : undefined;
    const [data, jumlahDiGudangBelumDibuka] = await Promise.all([
      baleRepository.list({ ...(input.status ? { status: input.status } : {}), ...(input.supplier ? { supplier: { contains: input.supplier } } : {}), ...(tanggalTerima ? { tanggalTerima } : {}) }),
      baleRepository.countByStatus("di gudang"),
    ]);
    return { data, jumlahDiGudangBelumDibuka };
  },
  async baleDetail(id: string) {
    const bale = await baleRepository.detail(id); if (!bale) throw errors.tidakDitemukan("Bale tidak ditemukan");
    return { ...bale, ringkasanItem: { masukStok: bale.items.filter((item) => item.status !== "diretur").length, diretur: bale.items.filter((item) => item.status === "diretur").length } };
  },
  async startSorting(id: string, actor: Actor) {
    const bale = await baleRepository.find(id); if (!bale) throw errors.tidakDitemukan("Bale tidak ditemukan");
    if (bale.status !== "di gudang") throw errors.konflik("Bale hanya dapat mulai disortir dari status di gudang");
    return db.$transaction(async (tx) => { const result = await baleRepository.updateStatus(id, "disortir", tx); await writeMovement({ objekTipe: "bale", objekId: id, tipe: "status", nilaiLama: bale.status, nilaiBaru: "disortir", userId: actor.id, baleId: id }, tx); return result; });
  },
  async createItem(input: { baleId: string; kategori: string; kondisi: string; hasil: "layak" | "retur"; alasanRetur?: string }, actor: Actor) {
    const bale = await baleRepository.find(input.baleId); if (!bale) throw errors.tidakDitemukan("Bale tidak ditemukan");
    if (bale.status !== "disortir") throw errors.konflik("Item hanya dapat dicatat saat bale disortir");
    return db.$transaction(async (tx) => {
      const number = (await itemRepository.countAll(tx)) + 1;
      const kode = `ZRF-${String(number).padStart(4, "0")}`;
      const status = input.hasil === "layak" ? "di laundry" : "diretur";
      const item = await itemRepository.create({ kode, baleId: input.baleId, kategori: input.kategori, kondisi: input.kondisi, status, ...(input.alasanRetur ? { alasanRetur: input.alasanRetur } : {}), laundrySejak: new Date() }, tx);
      await writeMovement({ objekTipe: "item", objekId: item.id, tipe: "status", nilaiBaru: status, userId: actor.id, baleId: bale.id }, tx);
      const total = await baleRepository.countItems(bale.id, tx);
      if (total === bale.jumlahItem) { await baleRepository.updateStatus(bale.id, "selesai disortir", tx); await writeMovement({ objekTipe: "bale", objekId: bale.id, tipe: "status", nilaiLama: bale.status, nilaiBaru: "selesai disortir", userId: actor.id, baleId: bale.id }, tx); }
      return item;
    });
  },
  async setGradePrice(id: string, input: { grade: string; harga: number }) {
    const item = await itemRepository.findById(id); if (!item) throw errors.tidakDitemukan("Item tidak ditemukan");
    if (item.status !== "di laundry") throw errors.konflik("Grade dan harga hanya dapat diubah saat item di laundry");
    return itemRepository.update(id, input);
  },
  async readyItem(id: string, locationId: string, actor: Actor) {
    const item = await itemRepository.findById(id); if (!item) throw errors.tidakDitemukan("Item tidak ditemukan");
    if (item.status !== "di laundry") throw errors.konflik("Item hanya dapat tersedia dari status di laundry");
    if (!item.grade || !item.harga) throw errors.konflik("Grade dan harga item harus dikonfirmasi terlebih dahulu");
    await requireLocation(locationId);
    return db.$transaction(async (tx) => { const result = await itemRepository.update(id, { status: "tersedia", locationId, tersediaSejak: new Date() }, tx); await writeMovement({ objekTipe: "item", objekId: id, tipe: "status", nilaiLama: item.status, nilaiBaru: "tersedia", userId: actor.id, baleId: item.baleId }, tx); return result; });
  },
  async listItems(input: { kode?: string; kategori?: string; grade?: string; status?: string; pencarian?: string; halaman: number; perHalaman: number }) {
    const where = { ...(input.kode ? { kode: { contains: input.kode } } : {}), ...(input.kategori ? { kategori: input.kategori } : {}), ...(input.grade ? { grade: input.grade } : {}), ...(input.status ? { status: input.status } : {}), ...(input.pencarian ? { OR: [{ kode: { contains: input.pencarian } }, { kategori: { contains: input.pencarian } }, { kondisi: { contains: input.pencarian } }] } : {}) };
    const [data, total] = await Promise.all([itemRepository.list(where, (input.halaman - 1) * input.perHalaman, input.perHalaman), itemRepository.count(where)]);
    return { data, meta: { halaman: input.halaman, perHalaman: input.perHalaman, total } };
  },
  async itemDetail(kode: string) { const item = await itemRepository.findByKode(kode); if (!item) throw errors.tidakDitemukan("Item tidak ditemukan"); return item; },
  async laundry() { const items = await itemRepository.laundry(); const now = Date.now(); return items.map((item) => ({ ...item, lamaHari: Math.floor((now - item.laundrySejak.getTime()) / 86_400_000) })); },
  async moveStock(input: { objekTipe: "bale" | "item"; objekId: string; keLocationId: string }, actor: Actor) {
    const target = await requireLocation(input.keLocationId);
    if (input.objekTipe === "bale") {
      const bale = await baleRepository.find(input.objekId); if (!bale) throw errors.tidakDitemukan("Bale tidak ditemukan");
      if (!bale.location) throw errors.konflik("Bale tidak memiliki lokasi untuk dipindahkan");
      return db.$transaction(async (tx) => { const result = await baleRepository.updateLocation(bale.id, target.id, tx); await writeMovement({ objekTipe: "bale", objekId: bale.id, tipe: "lokasi", nilaiLama: bale.location!.kode, nilaiBaru: target.kode, userId: actor.id, baleId: bale.id }, tx); return result; });
    }
    const item = await itemRepository.findById(input.objekId); if (!item) throw errors.tidakDitemukan("Item tidak ditemukan");
    if (!item.location) throw errors.konflik("Item tidak memiliki lokasi untuk dipindahkan");
    return db.$transaction(async (tx) => { const result = await itemRepository.update(item.id, { locationId: target.id }, tx); await writeMovement({ objekTipe: "item", objekId: item.id, tipe: "lokasi", nilaiLama: item.location!.kode, nilaiBaru: target.kode, userId: actor.id, baleId: item.baleId, orderId: item.orderId ?? undefined }, tx); return result; });
  },
  movements: (objekTipe?: string, objekId?: string) => movementRepository.list(objekTipe, objekId),
  async startStockCount(locationIds: string[], actor: Actor) {
    const unique = [...new Set(locationIds)];
    await Promise.all(unique.map(requireLocation));
    return stockCountRepository.create(unique, actor.id);
  },
  async recordStockCountItem(id: string, input: { kodeItem: string; locationId: string }) {
    const stockCount = await stockCountRepository.detail(id); if (!stockCount) throw errors.tidakDitemukan("Opname stok tidak ditemukan");
    if (stockCount.status !== "berjalan") throw errors.konflik("Opname stok tidak dalam status berjalan");
    if (!stockCount.locations.some((location) => location.locationId === input.locationId)) throw errors.konflik("Lokasi tidak termasuk dalam opname stok");
    return stockCountRepository.addFoundItem(id, input.kodeItem, input.locationId);
  },
  async submitStockCount(id: string, actor: Actor) {
    const stockCount = await stockCountRepository.detail(id); if (!stockCount) throw errors.tidakDitemukan("Opname stok tidak ditemukan");
    if (stockCount.status !== "berjalan") throw errors.konflik("Opname stok hanya dapat diajukan dari status berjalan");
    return stockCountRepository.update(id, { status: "menunggu persetujuan", waktuSubmit: new Date() });
  },
  async reconcileStockCount(id: string) {
    const result = await reconcile(id);
    return { status: result.stockCount.status, hilang: result.hilang, salahLokasi: result.salahLokasi.map(({ item, ditemukanDi }) => ({ item, ditemukanDi: ditemukanDi.location })) };
  },
  async approveStockCount(id: string, actor: Actor) {
    const state = await stockCountRepository.detail(id); if (!state) throw errors.tidakDitemukan("Opname stok tidak ditemukan");
    if (state.status !== "menunggu persetujuan") throw errors.konflik("Opname stok hanya dapat disetujui setelah diajukan");
    return db.$transaction(async (tx) => {
      const result = await reconcile(id, tx);
      for (const item of result.hilang) {
        await itemRepository.update(item.id, { status: "dihapusbukukan", locationId: null }, tx);
        await writeMovement({ objekTipe: "item", objekId: item.id, tipe: "status", nilaiLama: item.status, nilaiBaru: "dihapusbukukan", userId: actor.id, baleId: item.baleId, orderId: item.orderId ?? undefined, stockCountId: id }, tx);
      }
      for (const wrong of result.salahLokasi) {
        if (!wrong.item) continue;
        await itemRepository.update(wrong.item.id, { locationId: wrong.ditemukanDi.locationId }, tx);
        await writeMovement({ objekTipe: "item", objekId: wrong.item.id, tipe: "lokasi", nilaiLama: wrong.item.location?.kode ?? null, nilaiBaru: wrong.ditemukanDi.location.kode, userId: actor.id, baleId: wrong.item.baleId, orderId: wrong.item.orderId ?? undefined, stockCountId: id }, tx);
      }
      return stockCountRepository.update(id, { status: "disetujui", disetujuiOleh: actor.id, waktuSetuju: new Date() }, tx);
    });
  },
  async warehouseSummary(dari?: Date, sampai?: Date) {
    const [jumlahBaleDiGudang, all] = await Promise.all([baleRepository.countByStatus("di gudang"), itemRepository.allWithLocation()]);
    const within = (date: Date | null) => (!dari || (date && date >= dari)) && (!sampai || (date && date <= sampai));
    const items = all.filter((item) => within(item.keluarGudangPada ?? item.terjualPada ?? item.createdAt));
    const count = (status: string) => items.filter((item) => item.status === status);
    const tersedia = count("tersedia");
    return { jumlahBaleDiGudang, item: { diLaundry: count("di laundry").length, tersedia: { total: tersedia.length, perGrade: Object.fromEntries(["A", "B", "C"].map((grade) => [grade, tersedia.filter((item) => item.grade === grade).length])), perKategori: Object.fromEntries([...new Set(tersedia.map((item) => item.kategori))].map((kategori) => [kategori, tersedia.filter((item) => item.kategori === kategori).length])) }, dipesan: count("dipesan").length, terjual: count("terjual").length, keluarGudang: count("keluar gudang").length, diretur: count("diretur").length, dihapusbukukan: count("dihapusbukukan").length } };
  },
  async warehouseAging() {
    const items = (await itemRepository.allWithLocation()).filter((item) => item.status === "tersedia" && item.tersediaSejak);
    const now = Date.now(); const age = (item: (typeof items)[number]) => Math.floor((now - item.tersediaSejak!.getTime()) / 86_400_000);
    return { "0-30": items.filter((item) => age(item) <= 30), "31-60": items.filter((item) => age(item) >= 31 && age(item) <= 60), "61-90": items.filter((item) => age(item) >= 61 && age(item) <= 90), ">90": items.filter((item) => age(item) > 90) };
  },
  async shippedOut(dari?: Date, sampai?: Date) {
    return (await itemRepository.shippedOut(dari, sampai)).map((item) => ({ kode: item.kode, grade: item.grade, hargaJual: item.harga, tanggalTerjual: item.terjualPada, tanggalKeluarGudang: item.keluarGudangPada, orderId: item.orderId }));
  },
};
