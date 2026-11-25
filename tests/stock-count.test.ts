import { beforeAll, describe, expect, it } from "vitest";
import { db } from "../lib/db";
import { inventoryService } from "../services/s1-inventory/service";

describe("S1 stock opname", () => {
  let sorter: { id: string; role: string };
  let approver: { id: string; role: string };
  let r01s01: string;
  let r01s02: string;
  /** kode item freshly created for each test run to avoid cross-test state pollution */
  let itemAKode: string;
  let itemBKode: string;

  beforeAll(async () => {
    const [sorterUser, approverUser, first, second] = await Promise.all([
      db.appUser.findUniqueOrThrow({ where: { username: "penyortir" } }),
      db.appUser.findUniqueOrThrow({ where: { username: "admin" } }),
      db.location.findUniqueOrThrow({ where: { kode: "R01-S01" } }),
      db.location.findUniqueOrThrow({ where: { kode: "R01-S02" } }),
    ]);
    sorter = sorterUser;
    approver = approverUser;
    r01s01 = first.id;
    r01s02 = second.id;

    // Create a dedicated bale and two items for the opname tests
    const bale = await inventoryService.createBale(
      {
        supplier: "Opname Test Supplier",
        jenis: "kaos",
        beratKg: 5,
        jumlahItem: 2,
        tanggalTerima: new Date(),
        locationId: r01s01,
      },
      sorter,
    );
    await inventoryService.startSorting(bale.id, sorter);

    // Item A: will be recorded in r01s02 (wrong-location scenario)
    const rawA = await inventoryService.createItem(
      { baleId: bale.id, kategori: "kaos", kondisi: "baik", hasil: "layak" },
      sorter,
    );
    await inventoryService.setGradePrice(rawA.id, { grade: "A", harga: 80000 });
    const readyA = await inventoryService.readyItem(rawA.id, r01s01, sorter);
    itemAKode = readyA.kode;

    // Item B: will NOT be recorded (missing scenario)
    const rawB = await inventoryService.createItem(
      { baleId: bale.id, kategori: "kaos", kondisi: "baik", hasil: "layak" },
      sorter,
    );
    await inventoryService.setGradePrice(rawB.id, { grade: "B", harga: 60000 });
    const readyB = await inventoryService.readyItem(rawB.id, r01s02, sorter);
    itemBKode = readyB.kode;
  });

  it("writes a movement when an item is moved", async () => {
    const item = await db.item.findUniqueOrThrow({
      where: { kode: itemAKode },
    });
    const result = await inventoryService.moveStock(
      { objekTipe: "item", objekId: item.id, keLocationId: r01s02 },
      sorter,
    );
    expect(result.locationId).toBe(r01s02);
    const movements = await inventoryService.movements("item", item.id);
    expect(movements.at(-1)).toMatchObject({
      tipe: "lokasi",
      nilaiBaru: "R01-S02",
    });
    // Move it back so reconcile test sees it at r01s01
    await inventoryService.moveStock(
      { objekTipe: "item", objekId: item.id, keLocationId: r01s01 },
      sorter,
    );
  });

  it("reconciles missing and wrong-location items, then corrects them on approval", async () => {
    // State: itemA is at r01s01, itemB is at r01s02
    // Opname covers both locations; we record only itemA at r01s02 (wrong location reported)
    // Expected: itemB (at r01s02, not reported) → hilang; itemA (at r01s01, reported at r01s02) → salahLokasi
    const count = await inventoryService.startStockCount(
      [r01s01, r01s02],
      sorter,
    );
    await inventoryService.recordStockCountItem(count.id, {
      kodeItem: itemAKode,
      locationId: r01s02,
    });

    const before = await inventoryService.reconcileStockCount(count.id);
    expect(before.hilang.some((item) => item.kode === itemBKode)).toBe(true);
    expect(
      before.salahLokasi.some((entry) => entry.item?.kode === itemAKode),
    ).toBe(true);

    await inventoryService.submitStockCount(count.id, sorter);
    const approved = await inventoryService.approveStockCount(
      count.id,
      approver,
    );
    expect(approved.status).toBe("disetujui");

    const missing = await db.item.findUniqueOrThrow({
      where: { kode: itemBKode },
    });
    const moved = await db.item.findUniqueOrThrow({
      where: { kode: itemAKode },
    });
    expect(missing.status).toBe("dihapusbukukan");
    expect(moved.locationId).toBe(r01s02);
    expect(
      await db.stockMovement.count({ where: { stockCountId: count.id } }),
    ).toBeGreaterThanOrEqual(2);
  });

  it("rejects approval before a stock count is submitted", async () => {
    const count = await inventoryService.startStockCount([r01s01], sorter);
    await expect(
      inventoryService.approveStockCount(count.id, approver),
    ).rejects.toMatchObject({ status: 409 });
  });
});
