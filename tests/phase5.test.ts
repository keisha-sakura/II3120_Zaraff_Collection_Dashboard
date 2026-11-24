import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../lib/db";
import { inventoryService } from "../services/s1-inventory/service";
import { liveSellingService } from "../services/s10-live-selling/service";

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Force-close all active sessions to avoid "sesi sudah berjalan" conflicts */
async function closeActiveSessions() {
  await db.liveSession.updateMany({ where: { status: "berjalan" }, data: { status: "selesai", selesai: new Date() } });
}

async function makeReadyItem(locationId: string, actor: { id: string; role: string }) {
  // Find any existing disortir bale or create a fresh one
  let bale = await db.bale.findFirst({ where: { status: "disortir" } });
  if (!bale) {
    const newBale = await inventoryService.createBale(
      { supplier: "Live Test", jenis: "kaos", beratKg: 1, jumlahItem: 1, tanggalTerima: new Date(), locationId },
      actor,
    );
    await inventoryService.startSorting(newBale.id, actor);
    bale = newBale;
  }

  const raw = await inventoryService.createItem(
    { baleId: bale.id, kategori: "kaos", kondisi: "baik", hasil: "layak" },
    actor,
  );
  await inventoryService.setGradePrice(raw.id, { grade: "A", harga: 75000 });
  return inventoryService.readyItem(raw.id, locationId, actor);
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe("Fase 5: S10 Live Selling & LiveClaimContract", () => {
  let hostActor: { id: string; role: string };
  let locationId: string;

  beforeAll(async () => {
    await closeActiveSessions();
    const host = await db.appUser.findUniqueOrThrow({ where: { username: "host" } });
    const loc = await db.location.findUniqueOrThrow({ where: { kode: "R01-S01" } });
    hostActor = host;
    locationId = loc.id;
  });

  // ── Session lifecycle ────────────────────────────────────────────────────
  describe("Session lifecycle", () => {
    it("opens and closes a session", async () => {
      const session = await liveSellingService.openSession("Sesi Test Fase 5");
      expect(session.status).toBe("berjalan");

      // Cannot open a second session while one is active
      await expect(liveSellingService.openSession("Sesi Duplikat")).rejects.toMatchObject({ status: 409 });

      const closed = await liveSellingService.closeSession(session.id);
      expect(closed.status).toBe("selesai");
    });

    it("cannot close a session that is already closed", async () => {
      const session = await liveSellingService.openSession("Sesi Tutup Test");
      await liveSellingService.closeSession(session.id);
      await expect(liveSellingService.closeSession(session.id)).rejects.toMatchObject({ status: 409 });
    });
  });

  // ── Single claim ─────────────────────────────────────────────────────────
  describe("Single claim", () => {
    it("valid claim wins and creates an order", async () => {
      const item = await makeReadyItem(locationId, hostActor);
      const session = await liveSellingService.openSession("Sesi Klaim Tunggal");

      const result = await liveSellingService.inputClaim(session.id, {
        kodeProduk: item.kode,
        idPembeli: "cust-001",
        handle: "@cust001",
        waktuKomentar: new Date(),
      });

      expect(result.diterima).toBe(true);
      expect(result.idPesanan).toBeDefined();

      // Item must now be "dipesan"
      const updated = await db.item.findUniqueOrThrow({ where: { kode: item.kode } });
      expect(updated.status).toBe("dipesan");

      // Order must exist
      const order = await db.order.findUniqueOrThrow({ where: { id: result.idPesanan } });
      expect(order.sumber).toBe("live");
      expect(order.status).toBe("menunggu pembayaran");

      // StatusLog for claim must exist
      const log = await db.statusLog.findFirst({ where: { entitas: "Claim", keStatus: "menang" } });
      expect(log).not.toBeNull();

      await liveSellingService.closeSession(session.id);
    });

    it("claim on non-existent item is 'tidak valid'", async () => {
      const session = await liveSellingService.openSession("Sesi Invalid Klaim");
      const result = await liveSellingService.inputClaim(session.id, {
        kodeProduk: "ZRF-9999",
        idPembeli: "cust-002",
        handle: "@cust002",
        waktuKomentar: new Date(),
      });
      expect(result.diterima).toBe(false);

      const claim = await db.claim.findFirst({ where: { kodeItem: "ZRF-9999", status: "tidak valid" } });
      expect(claim).not.toBeNull();
      await liveSellingService.closeSession(session.id);
    });

    it("claim on item that is not 'tersedia' is 'tidak valid'", async () => {
      const item = await makeReadyItem(locationId, hostActor);
      const session = await liveSellingService.openSession("Sesi Tidak Tersedia");

      // First claim wins
      await liveSellingService.inputClaim(session.id, {
        kodeProduk: item.kode,
        idPembeli: "cust-003",
        handle: "@cust003",
        waktuKomentar: new Date(),
      });

      // Second claim should be "tidak valid" (item already "dipesan")
      const second = await liveSellingService.inputClaim(session.id, {
        kodeProduk: item.kode,
        idPembeli: "cust-004",
        handle: "@cust004",
        waktuKomentar: new Date(),
      });
      expect(second.diterima).toBe(false);

      await liveSellingService.closeSession(session.id);
    });
  });

  // ── 20 concurrent claims — the critical test ──────────────────────────────
  describe("Concurrent claims (20 parallel)", () => {
    it("exactly 1 winner and 1 order for 20 simultaneous claims", async () => {
      const item = await makeReadyItem(locationId, hostActor);
      const session = await liveSellingService.openSession("Sesi 20 Paralel");

      // Fire 20 claims simultaneously
      const results = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          liveSellingService.handleContractClaim({
            kodeProduk: item.kode,
            idPembeli: `cust-parallel-${i}`,
            handlePembeli: `@parallel${i}`,
            waktuKomentar: new Date(),
          }),
        ),
      );

      const winners = results.filter((r) => r.diterima);
      const orderIds = winners.map((r) => r.idPesanan).filter(Boolean);

      // Exactly 1 winner
      expect(winners).toHaveLength(1);
      // Exactly 1 unique order
      expect(new Set(orderIds).size).toBe(1);
      // No double-selling: item has exactly one order
      const finalItem = await db.item.findUniqueOrThrow({ where: { kode: item.kode } });
      expect(finalItem.status).toBe("dipesan");
      const ordersForItem = await db.orderItem.count({ where: { kode: item.kode } });
      expect(ordersForItem).toBe(1);

      // StatusLog recorded for winner
      const winLog = await db.statusLog.findFirst({
        where: { entitas: "Claim", keStatus: "menang" },
        orderBy: { waktu: "desc" },
      });
      expect(winLog).not.toBeNull();

      await liveSellingService.closeSession(session.id);
    }, 30000); // allow up to 30s for 20 concurrent DB transactions
  });

  // ── CSV import ────────────────────────────────────────────────────────────
  describe("CSV import", () => {
    it("imports claims sorted by time — earliest wins", async () => {
      const item = await makeReadyItem(locationId, hostActor);
      const session = await liveSellingService.openSession("Sesi CSV");

      const csv = [
        "kode,id_pembeli,handle,waktu",
        // Later time first in CSV → should still lose
        `${item.kode},cust-csv-late,@late,2026-01-01T10:00:02Z`,
        // Earlier time → should win
        `${item.kode},cust-csv-early,@early,2026-01-01T10:00:01Z`,
        // Another item that doesn't exist → tidak valid
        `ZRF-XXXX,cust-csv-x,@x,2026-01-01T10:00:00Z`,
      ].join("\n");

      const results = await liveSellingService.importCsv(session.id, csv);
      const winner = results.find((r) => r.result.diterima);
      expect(winner).toBeDefined();
      expect(winner!.row.idPembeli).toBe("cust-csv-early");

      const loser = results.find((r) => !r.result.diterima && r.row.idPembeli === "cust-csv-late");
      expect(loser).toBeDefined();

      await liveSellingService.closeSession(session.id);
    });
  });

  // ── Contract endpoint: no active session ─────────────────────────────────
  describe("LiveClaimContract", () => {
    it("returns diterima=false when no active session", async () => {
      // Make sure no session is active (all prior tests close their sessions)
      const result = await liveSellingService.handleContractClaim({
        kodeProduk: "ZRF-0001",
        idPembeli: "cust-999",
        handlePembeli: "@nobody",
        waktuKomentar: new Date(),
      });
      expect(result.diterima).toBe(false);
      expect(result.alasan).toBe("Sesi live tidak aktif");
    });
  });
});
