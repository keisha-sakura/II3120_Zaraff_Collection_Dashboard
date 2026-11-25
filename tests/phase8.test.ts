import { describe, expect, it } from "vitest";
import { db } from "../lib/db";
import { fulfillmentService } from "../services/s12-order-fulfillment/service";
import { reportingService } from "../services/s8-reporting/service";
import { strategyService } from "../services/s11-sales-strategy/service";
import { claimedOrder, request } from "./support/prototype";
import { GET as sales } from "../src/app/api/reports/sales/route";
import { GET as overview } from "../src/app/api/reports/overview/route";
import { GET as audit } from "../src/app/api/audit/route";
import { POST as strategy } from "../src/app/api/strategies/route";
import { GET as notifications } from "../src/app/api/notifications/me/route";
import { signToken, type Role } from "../lib/auth";
import { randomUUID } from "node:crypto";
import { GET as items } from "../src/app/api/items/route";

describe("Fase 8: laporan, strategi, audit", () => {
  it("memuat halaman daftar dari 1.000 item dalam kurang dari dua detik", async () => {
    const bale = await db.bale.findFirstOrThrow();
    const location = await db.location.findFirstOrThrow();
    const prefix = `PERF-${randomUUID()}`;
    await db.item.createMany({
      data: Array.from({ length: 1000 }, (_, index) => ({
        kode: `${prefix}-${index}`,
        baleId: bale.id,
        kategori: "kaos",
        kondisi: "baik",
        status: "tersedia",
        grade: "A",
        harga: 50000,
        locationId: location.id,
        laundrySejak: new Date(),
        tersediaSejak: new Date(),
      })),
    });
    try {
      const start = performance.now();
      const response = await items(
        request(
          `items?kode=${prefix}&perHalaman=100`,
          "GET",
          undefined,
          "admin",
        ),
      );
      const result: { data: unknown[]; meta: { total: number } } =
        await response.json();
      const elapsed = performance.now() - start;
      expect(response.status).toBe(200);
      expect(result.meta.total).toBe(1000);
      expect(result.data).toHaveLength(100);
      expect(elapsed).toBeLessThan(2000);
      console.info("Kinerja daftar item", {
        jumlahData: 1000,
        perHalaman: 100,
        milidetik: elapsed,
      });
    } finally {
      await db.item.deleteMany({ where: { kode: { startsWith: prefix } } });
    }
  });
  it("menghitung overview dan stok sama dengan daftar database", async () => {
    const result = await reportingService.overview({});
    expect(result.stokTersedia).toBe(
      await db.item.count({ where: { status: "tersedia" } }),
    );
    expect(result.pesananAktif).toBe(
      await db.order.count({ where: { status: { not: "selesai" } } }),
    );
    expect(result.pembayaranMenungguValidasi).toBe(
      await db.payment.count({ where: { status: "menunggu validasi" } }),
    );
    expect(result.pengirimanBerjalan).toBe(
      await db.shipment.count({ where: { status: { not: "diterima" } } }),
    );
    const stock = await reportingService.stock();
    expect(stock.total).toBe(await db.item.count());
    expect(stock.perStatus.tersedia).toBe(result.stokTersedia);
    const filtered = await reportingService.overview({
      dari: new Date("2099-01-01Z"),
      sampai: new Date("2099-12-31Z"),
    });
    expect(filtered.pesananAktif).toBe(0);
    expect(filtered.stokTersedia).toBe(result.stokTersedia);
  });
  it("menggunakan bulan WIB, pendapatan sesudah diskon, shipped-out konsisten, ekspor CSV", async () => {
    const f = await claimedOrder();
    await db.customer.update({
      where: { id: f.customerId },
      data: { isMember: true, saldoDeposit: 200000 },
    });
    const invoice = await fulfillmentService.createInvoice(
      f.orderId,
      f.adminId,
    );
    const payment = await fulfillmentService.recordPayment(
      invoice.id,
      { metode: "deposit" },
      f.adminId,
    );
    await fulfillmentService.validatePayment(
      payment.id,
      "setuju",
      undefined,
      f.adminId,
    );
    await fulfillmentService.qualityCheck(f.orderId, [f.kode], f.adminId);
    await fulfillmentService.pack(f.orderId, f.adminId);
    await fulfillmentService.handover(
      f.orderId,
      { kurir: "Simulasi", noResi: `REPORT-${f.orderId}` },
      f.adminId,
    );
    await db.item.update({
      where: { id: f.itemId },
      data: {
        terjualPada: new Date("2024-04-30T17:00:00Z"),
        keluarGudangPada: new Date("2024-05-31T16:59:59.999Z"),
      },
    });
    const report = await reportingService.sales("2024-05");
    expect(report.itemTerjual.map((item) => item.kode)).toContain(f.kode);
    expect(report.pendapatan).toBe(90000);
    const shipped = await db.item.findMany({
      where: {
        status: "keluar gudang",
        keluarGudangPada: {
          gte: new Date("2024-04-30T17:00:00Z"),
          lte: new Date("2024-05-31T16:59:59.999Z"),
        },
      },
    });
    expect(report.jumlahKeluarGudang).toBe(shipped.length);
    expect(report.keluarGudang.map((item) => item.kode).sort()).toEqual(
      shipped.map((item) => item.kode).sort(),
    );
    expect(
      (await reportingService.sales("2024-04")).itemTerjual.map(
        (item) => item.kode,
      ),
    ).not.toContain(f.kode);
    const csv = await sales(
      request(
        "reports/sales?bulan=2024-05&format=csv",
        "GET",
        undefined,
        "pemilik",
      ),
    );
    expect(csv.status).toBe(200);
    expect(csv.headers.get("content-type")).toContain("text/csv");
    expect(await csv.text()).toContain('"2024-05","1","90000"');
  });
  it("mendistribusikan tepat satu notifikasi per staf, menolak penerima invalid secara atomik", async () => {
    const owner = await db.appUser.findUniqueOrThrow({
      where: { username: "pemilik" },
    });
    const host = await db.appUser.findUniqueOrThrow({
      where: { username: "host" },
    });
    const packer = await db.appUser.findUniqueOrThrow({
      where: { username: "pengemas" },
    });
    const result = await strategyService.create(
      {
        periode: "2024-06",
        isi: "Prioritaskan stok lama",
        penerimaUserIds: [host.id, host.id, packer.id],
      },
      owner.id,
    );
    const logs = await db.notificationLog.findMany({
      where: { tipe: "strategi", isi: { contains: result.id } },
    });
    expect(logs.map((log) => log.tujuan).sort()).toEqual(
      [host.id, packer.id].sort(),
    );
    const token = signToken({
      id: host.id,
      username: host.username,
      role: host.role as Role,
    });
    const response = await notifications(
      new Request("http://localhost/api/notifications/me", {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(await response.text()).toContain(result.id);
    await expect(
      strategyService.create(
        {
          periode: "2024-07",
          isi: "Invalid",
          penerimaUserIds: [host.id, "missing"],
        },
        owner.id,
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      await db.strategy.findUnique({ where: { periode: "2024-07" } }),
    ).toBeNull();
    await expect(
      strategyService.create(
        { periode: "2024-06", isi: "Duplikat", penerimaUserIds: [host.id] },
        owner.id,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("melindungi laporan/strategi/audit dan memvalidasi query", async () => {
    expect(
      (await overview(request("reports/overview", "GET", undefined, undefined)))
        .status,
    ).toBe(401);
    expect(
      (await overview(request("reports/overview", "GET", undefined, "admin")))
        .status,
    ).toBe(403);
    expect(
      (
        await overview(
          request(
            "reports/overview?dari=2026-12-01&sampai=2026-01-01",
            "GET",
            undefined,
            "pemilik",
          ),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await sales(
          request("reports/sales?bulan=2026-13", "GET", undefined, "pemilik"),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await strategy(
          request(
            "strategies",
            "POST",
            { periode: "2026-01", isi: "X", penerimaUserIds: ["host"] },
            "admin",
          ),
        )
      ).status,
    ).toBe(403);
    expect(
      (await audit(request("audit", "GET", undefined, "host"))).status,
    ).toBe(403);
    const log = await db.statusLog.findFirstOrThrow();
    const response = await audit(
      request(
        `audit?entitas=${log.entitas}&entitasId=${log.entitasId}`,
        "GET",
        undefined,
        "admin",
      ),
    );
    const entries = (await response.json()).data as { entitasId: string }[];
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.entitasId === log.entitasId)).toBe(
      true,
    );
  });
});
