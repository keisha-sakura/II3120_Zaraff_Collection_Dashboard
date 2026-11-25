import { db, type DbTransaction } from "@backend/lib/db";
import { AppError, errors } from "@backend/lib/errors";
import { catatStatus } from "@backend/services/audit/service";
import { inventoryService } from "@backend/services/s1-inventory/service";
import { orderService } from "@backend/services/s2-order/service";
import { notificationService } from "@backend/services/s7-notification/service";
import { claimRepository, liveSessionRepository } from "./repository";
import type { ClaimResult } from "./types";
import type { Claim } from "@prisma/client";

async function createClaim(
  input: Parameters<typeof claimRepository.create>[0],
  tx?: DbTransaction,
): Promise<Claim> {
  if (!tx)
    return db.$transaction((transaction) => createClaim(input, transaction));
  const claim = await claimRepository.create(input, tx);
  await catatStatus(
    "Claim",
    claim.id,
    undefined,
    claim.status,
    input.customerId,
    tx,
  );
  return claim;
}

// ─── internal helper ─────────────────────────────────────────────────────────

/**
 * Core atomic claim processor.
 * Must be called with the item already validated as "tersedia".
 * Returns ClaimResult. Never throws for business rejections.
 */
async function processClaim(input: {
  sessionId: string;
  kodeItem: string;
  itemId: string;
  customerId: string;
  handle: string;
  komentar: string;
  waktuKomentar: Date;
  harga: number;
}): Promise<ClaimResult & { claimId: string }> {
  try {
    return await db.$transaction(async (tx) => {
      // 1. Create order first (gets an ID we'll use as orderId on item)
      const order = await orderService.createOrder(
        {
          customerId: input.customerId,
          subtotal: input.harga,
          diskon: 0,
          total: input.harga,
          sumber: "live",
          itemId: input.itemId,
          kode: input.kodeItem,
          harga: input.harga,
        },
        tx,
      );

      // 2. Atomic reserve: updateMany where status='tersedia'
      //    If count === 0 → item was taken concurrently → throw → tx rolls back
      await inventoryService.reserveItem(
        input.itemId,
        order.id,
        input.customerId,
        tx,
      );

      // 3. Create winning claim
      const claim = await createClaim(
        {
          sessionId: input.sessionId,
          kodeItem: input.kodeItem,
          customerId: input.customerId,
          handle: input.handle,
          komentar: input.komentar,
          waktuKomentar: input.waktuKomentar,
          status: "menang",
        },
        tx,
      );

      // 4. Audit StatusLog for claim

      return {
        diterima: true,
        alasan: "Klaim berhasil",
        idPesanan: order.id,
        claimId: claim.id,
      };
    });
  } catch (err: unknown) {
    if (!(err instanceof AppError) || err.status !== 409) throw err;
    // Race lost or any other error → create a rejected claim (outside transaction, which rolled back)
    const alasan = "Produk sudah dipesan";

    const claim = await createClaim({
      sessionId: input.sessionId,
      kodeItem: input.kodeItem,
      customerId: input.customerId,
      handle: input.handle,
      komentar: input.komentar,
      waktuKomentar: input.waktuKomentar,
      status: "ditolak",
      alasan,
    });

    return { diterima: false, alasan, claimId: claim.id };
  }
}

// ─── service ─────────────────────────────────────────────────────────────────

export const liveSellingService = {
  // ── Sessions ──────────────────────────────────────────────────────────────
  async openSession(judul: string) {
    const existing = await liveSessionRepository.findActive();
    if (existing)
      throw errors.konflik("Sudah ada sesi live yang sedang berjalan");
    return liveSessionRepository.create(judul);
  },

  async closeSession(id: string) {
    const session = await liveSessionRepository.findById(id);
    if (!session) throw errors.tidakDitemukan("Sesi live tidak ditemukan");
    if (session.status !== "berjalan")
      throw errors.konflik("Sesi live tidak dalam status berjalan");
    return liveSessionRepository.updateStatus(id, "selesai");
  },

  listSessions: () => liveSessionRepository.list(),

  // ── Single claim (host input) ─────────────────────────────────────────────
  async inputClaim(
    sessionId: string,
    input: {
      kodeProduk: string;
      idPembeli: string;
      handle: string;
      waktuKomentar: Date;
    },
  ): Promise<ClaimResult & { claimId: string }> {
    const session = await liveSessionRepository.findById(sessionId);
    if (!session) throw errors.tidakDitemukan("Sesi live tidak ditemukan");
    if (session.status !== "berjalan")
      throw errors.konflik("Sesi live tidak dalam status berjalan");

    // Check item exists and is available
    const item = await inventoryService.findItem(input.kodeProduk);
    if (!item || item.status !== "tersedia") {
      const claim = await createClaim({
        sessionId,
        kodeItem: input.kodeProduk,
        customerId: input.idPembeli,
        handle: input.handle,
        komentar: input.kodeProduk,
        waktuKomentar: input.waktuKomentar,
        status: "tidak valid",
        alasan: item ? "Item tidak tersedia" : "Kode produk tidak ditemukan",
      });
      await notificationService.send({
        tipe: "claimResult",
        tujuan: input.idPembeli,
        isi: `Klaim ${input.kodeProduk}: ${claim.alasan}`,
      });
      return { diterima: false, alasan: claim.alasan!, claimId: claim.id };
    }

    const result = await processClaim({
      sessionId,
      kodeItem: input.kodeProduk,
      itemId: item.id,
      customerId: input.idPembeli,
      handle: input.handle,
      komentar: input.kodeProduk,
      waktuKomentar: input.waktuKomentar,
      harga: item.harga!,
    });

    // Notify via S7
    await notificationService.send({
      tipe: "claimResult",
      tujuan: input.idPembeli,
      isi: result.diterima
        ? `Klaim ${input.kodeProduk} MENANG. ID pesanan: ${result.idPesanan}`
        : `Klaim ${input.kodeProduk} DITOLAK: ${result.alasan}`,
    });

    return result;
  },

  // ── CSV import ────────────────────────────────────────────────────────────
  async importCsv(sessionId: string, csvText: string) {
    const session = await liveSessionRepository.findById(sessionId);
    if (!session) throw errors.tidakDitemukan("Sesi live tidak ditemukan");
    if (session.status !== "berjalan")
      throw errors.konflik("Sesi live tidak dalam status berjalan");

    // Parse CSV manually — header: kode,id_pembeli,handle,waktu
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
    const [header, ...rows] = lines;
    if (!header?.toLowerCase().startsWith("kode")) {
      throw errors.validasi(
        "CSV harus memiliki header: kode,id_pembeli,handle,waktu",
      );
    }

    const parsed = rows
      .map((row) => {
        const [kode, id_pembeli, handle, waktu] = row
          .split(",")
          .map((s) => s.trim());
        const waktuKomentar = new Date(waktu ?? "");
        if (!kode || !id_pembeli || !handle || isNaN(waktuKomentar.getTime()))
          return null;
        return {
          kodeProduk: kode,
          idPembeli: id_pembeli,
          handle,
          waktuKomentar,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    // Sort by waktuKomentar ascending before processing
    parsed.sort(
      (a, b) => a.waktuKomentar.getTime() - b.waktuKomentar.getTime(),
    );

    const results: Array<{
      row: (typeof parsed)[number];
      result: ClaimResult;
    }> = [];

    for (const row of parsed) {
      const item = await inventoryService.findItem(row.kodeProduk);
      if (!item || item.status !== "tersedia") {
        const claim = await createClaim({
          sessionId,
          kodeItem: row.kodeProduk,
          customerId: row.idPembeli,
          handle: row.handle,
          komentar: row.kodeProduk,
          waktuKomentar: row.waktuKomentar,
          status: "tidak valid",
          alasan: item ? "Item tidak tersedia" : "Kode produk tidak ditemukan",
        });
        await notificationService.send({
          tipe: "claimResult",
          tujuan: row.idPembeli,
          isi: `Klaim ${row.kodeProduk}: ${claim.alasan}`,
        });
        results.push({
          row,
          result: { diterima: false, alasan: claim.alasan! },
        });
        continue;
      }

      const result = await processClaim({
        sessionId,
        kodeItem: row.kodeProduk,
        itemId: item.id,
        customerId: row.idPembeli,
        handle: row.handle,
        komentar: row.kodeProduk,
        waktuKomentar: row.waktuKomentar,
        harga: item.harga!,
      });

      await notificationService.send({
        tipe: "claimResult",
        tujuan: row.idPembeli,
        isi: result.diterima
          ? `Klaim ${row.kodeProduk} MENANG. ID pesanan: ${result.idPesanan}`
          : `Klaim ${row.kodeProduk} DITOLAK: ${result.alasan}`,
      });

      results.push({ row, result });
    }

    return results;
  },

  listClaims: (sessionId: string) => claimRepository.listBySession(sessionId),

  // ── LiveClaimContract (public endpoint) ──────────────────────────────────
  async handleContractClaim(input: {
    kodeProduk: string;
    idPembeli: string;
    handlePembeli: string;
    waktuKomentar: Date;
  }): Promise<ClaimResult> {
    // Check active session
    const session = await liveSessionRepository.findActive();
    if (!session) {
      await notificationService.send({
        tipe: "claimResult",
        tujuan: input.idPembeli,
        isi: "Sesi live tidak aktif",
      });
      return { diterima: false, alasan: "Sesi live tidak aktif" };
    }

    // Check item
    const item = await inventoryService.findItem(input.kodeProduk);
    if (!item || item.status !== "tersedia") {
      const claim = await createClaim({
        sessionId: session.id,
        kodeItem: input.kodeProduk,
        customerId: input.idPembeli,
        handle: input.handlePembeli,
        komentar: input.kodeProduk,
        waktuKomentar: input.waktuKomentar,
        status: "tidak valid",
        alasan: item ? "Item tidak tersedia" : "Kode produk tidak ditemukan",
      });
      await notificationService.send({
        tipe: "claimResult",
        tujuan: input.idPembeli,
        isi: `Klaim ${input.kodeProduk} TIDAK VALID: ${claim.alasan}`,
      });
      return { diterima: false, alasan: claim.alasan! };
    }

    const result = await processClaim({
      sessionId: session.id,
      kodeItem: input.kodeProduk,
      itemId: item.id,
      customerId: input.idPembeli,
      handle: input.handlePembeli,
      komentar: input.kodeProduk,
      waktuKomentar: input.waktuKomentar,
      harga: item.harga!,
    });

    await notificationService.send({
      tipe: "claimResult",
      tujuan: input.idPembeli,
      isi: result.diterima
        ? `Klaim ${input.kodeProduk} MENANG. ID pesanan: ${result.idPesanan}`
        : `Klaim ${input.kodeProduk} DITOLAK: ${result.alasan}`,
    });

    return result;
  },
};
