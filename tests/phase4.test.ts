import { beforeAll, describe, expect, it } from "vitest";
import { db } from "../lib/db";
import { memberService } from "../services/s3-member/service";
import { orderService } from "../services/s2-order/service";
import { notificationService } from "../services/s7-notification/service";
import { promotionService } from "../services/s9-promotion/service";

describe("Fase 4: Member, Order, Notification, Promotion", () => {
  let adminId: string;
  let customerId: string;

  beforeAll(async () => {
    const admin = await db.appUser.findUniqueOrThrow({ where: { username: "admin" } });
    adminId = admin.id;
  });

  // ─── S3 Member ───────────────────────────────────────────────────────────────
  describe("S3 Member", () => {
    it("creates a customer and updates their data", async () => {
      const customer = await memberService.create({
        nama: "Test Pelanggan",
        noWa: "081299999001",
        handleSosmed: "@test_pelanggan_fase4",
        isMember: false,
      });
      expect(customer.nama).toBe("Test Pelanggan");
      customerId = customer.id;

      const updated = await memberService.update(customerId, { isMember: true });
      expect(updated.isMember).toBe(true);
    });

    it("adds deposit and returns member status", async () => {
      await memberService.addDeposit(customerId, 150000);
      const status = await memberService.memberStatus(customerId);
      expect(status.saldoDeposit).toBeGreaterThanOrEqual(150000);
    });

    it("deducts deposit correctly and rejects if insufficient", async () => {
      await memberService.deductDeposit(customerId, 50000);
      const status = await memberService.memberStatus(customerId);
      expect(status.saldoDeposit).toBeGreaterThanOrEqual(100000);

      await expect(memberService.deductDeposit(customerId, 9999999)).rejects.toMatchObject({ status: 409 });
    });

    it("rejects duplicate handleSosmed", async () => {
      await expect(
        memberService.create({ nama: "Duplikat", noWa: "081299999002", handleSosmed: "@test_pelanggan_fase4" }),
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  // ─── S2 Order ────────────────────────────────────────────────────────────────
  describe("S2 Order", () => {
    it("creates an order and transitions status legally", async () => {
      const item = await db.item.findFirstOrThrow({ where: { status: "tersedia" } });
      const order = await orderService.createOrder({
        customerId,
        subtotal: item.harga!,
        diskon: 0,
        total: item.harga!,
        sumber: "test",
        itemId: item.id,
        kode: item.kode,
        harga: item.harga!,
      });
      expect(order.status).toBe("menunggu pembayaran");

      await orderService.updateStatus(order.id, "lunas", adminId);
      const after = await orderService.findById(order.id);
      expect(after.status).toBe("lunas");
    });

    it("rejects an illegal order status transition", async () => {
      const item2 = await db.item.findFirstOrThrow({ where: { status: "tersedia" } });
      const order2 = await orderService.createOrder({
        customerId,
        subtotal: item2.harga!,
        diskon: 0,
        total: item2.harga!,
        sumber: "test",
        itemId: item2.id,
        kode: item2.kode,
        harga: item2.harga!,
      });
      await expect(
        orderService.updateStatus(order2.id, "selesai", adminId),
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  // ─── S7 Notification ─────────────────────────────────────────────────────────
  describe("S7 Notification", () => {
    it("sends a notification and lists it", async () => {
      await notificationService.send({ tipe: "broadcast", tujuan: "semua pelanggan", isi: "Test broadcast fase 4" });
      const list = await notificationService.listAll();
      expect(list.some((n) => n.isi === "Test broadcast fase 4")).toBe(true);
    });

    it("lists notifications per user", async () => {
      await notificationService.send({ tipe: "strategi", tujuan: "admin", isi: "Notif untuk admin" });
      const mine = await notificationService.listForUser("admin");
      expect(mine.some((n) => n.isi === "Notif untuk admin")).toBe(true);
    });
  });

  // ─── S9 Promotion ────────────────────────────────────────────────────────────
  describe("S9 Promotion", () => {
    it("creates a promotion with items, publishes it, and sends reminder", async () => {
      const item = await db.item.findFirstOrThrow({ where: { status: "tersedia" } });
      const promo = await promotionService.create({
        judul: "Flash Sale Fase 4",
        isi: "Diskon gede-gedean!",
        kanal: "TikTok",
        jadwalLive: new Date(Date.now() + 86_400_000),
        itemIds: [item.id],
      });
      expect(promo?.status).toBe("draf");
      expect(promo?.items.length).toBe(1);

      const published = await promotionService.publish(promo!.id);
      expect(published?.status).toBe("dipublikasikan");

      // Should create a broadcast notification
      const notifs = await notificationService.listAll();
      expect(notifs.some((n) => n.tipe === "broadcast" && n.isi.includes("Flash Sale Fase 4"))).toBe(true);

      const reminder = await promotionService.sendReminder(promo!.id);
      expect(reminder.pesan).toContain("Reminder berhasil dikirim");
    });

    it("updates a promotion", async () => {
      const promo = await promotionService.create({
        judul: "Promo Update Test",
        isi: "Isi awal",
        kanal: "Instagram",
        jadwalLive: new Date(Date.now() + 86_400_000),
      });
      const updated = await promotionService.update(promo!.id, { judul: "Promo Updated" });
      expect(updated?.judul).toBe("Promo Updated");
    });
  });

  // ─── RBAC Fase 4 ─────────────────────────────────────────────────────────────
  describe("RBAC Fase 4 — API level (HTTP 401/403)", () => {
    const base = "http://localhost";
    const makeReq = (path: string, role?: string) =>
      new Request(`${base}${path}`, role ? { headers: { authorization: `Bearer bad-token-${role}` } } : {});

    it("GET /api/customers requires auth", async () => {
      const { GET } = await import("../src/app/api/customers/route");
      const res = await GET(makeReq("/api/customers"));
      expect(res.status).toBe(401);
    });

    it("GET /api/notifications requires auth", async () => {
      const { GET } = await import("../src/app/api/notifications/route");
      const res = await GET(makeReq("/api/notifications"));
      expect(res.status).toBe(401);
    });
  });
});
