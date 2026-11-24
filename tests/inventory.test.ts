import { beforeAll, describe, expect, it } from "vitest";
import { db } from "../lib/db";
import { inventoryService } from "../services/s1-inventory/service";
import { pricingService } from "../services/s6-pricing/service";

describe("S1 inventory and S6 pricing", () => {
  let actor: { id: string; role: string };
  let locationId: string;

  beforeAll(async () => {
    const user = await db.appUser.findUniqueOrThrow({ where: { username: "penyortir" } });
    const location = await db.location.findUniqueOrThrow({ where: { kode: "R01-S01" } });
    actor = user;
    locationId = location.id;
  });

  it("enforces legal bale and item transitions and writes movements", async () => {
    const bale = await inventoryService.createBale({ supplier: "Test Supplier", jenis: "kemeja", beratKg: 10, jumlahItem: 2, tanggalTerima: new Date(), locationId }, actor);
    await expect(inventoryService.createItem({ baleId: bale.id, kategori: "kemeja", kondisi: "baik", hasil: "layak" }, actor)).rejects.toMatchObject({ status: 409 });
    await inventoryService.startSorting(bale.id, actor);
    const first = await inventoryService.createItem({ baleId: bale.id, kategori: "kemeja", kondisi: "baik", hasil: "layak" }, actor);
    await expect(inventoryService.readyItem(first.id, locationId, actor)).rejects.toMatchObject({ status: 409 });
    await inventoryService.setGradePrice(first.id, { grade: "A", harga: 100000 });
    const ready = await inventoryService.readyItem(first.id, locationId, actor);
    expect(ready.status).toBe("tersedia");
    expect(ready.locationId).toBe(locationId);
    await inventoryService.createItem({ baleId: bale.id, kategori: "kaos", kondisi: "cukup", hasil: "retur", alasanRetur: "Robek" }, actor);
    expect((await inventoryService.baleDetail(bale.id)).status).toBe("selesai disortir");
    expect(await db.stockMovement.count({ where: { objekId: first.id, tipe: "status" } })).toBeGreaterThanOrEqual(2);
  });

  it("rejects a repeated or illegal bale transition", async () => {
    const bale = await inventoryService.createBale({ supplier: "Test Supplier 2", jenis: "kaos", beratKg: 5, jumlahItem: 1, tanggalTerima: new Date(), locationId }, actor);
    await inventoryService.startSorting(bale.id, actor);
    await expect(inventoryService.startSorting(bale.id, actor)).rejects.toMatchObject({ status: 409 });
  });

  it("returns seeded price suggestions", async () => {
    const suggestions = await pricingService.suggest("kemeja", "baik");
    expect(suggestions).toHaveLength(3);
    expect(suggestions.map((rule) => rule.grade)).toEqual(expect.arrayContaining(["A", "B", "C"]));
  });
});
