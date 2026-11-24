import { beforeAll, describe, expect, it } from "vitest";
import { db } from "../lib/db";
import { inventoryService } from "../services/s1-inventory/service";
import { liveSellingService } from "../services/s10-live-selling/service";
import { fulfillmentService } from "../services/s12-order-fulfillment/service";
import { memberService } from "../services/s3-member/service";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function createReadyItem(locationId: string, actor: { id: string; role: string }) {
  const bale = await inventoryService.createBale(
    { supplier: "Phase6 Supplier", jenis: "kaos", beratKg: 1, jumlahItem: 1, tanggalTerima: new Date(), locationId },
    actor,
  );
  await inventoryService.startSorting(bale.id, actor);
  const raw = await inventoryService.createItem({ baleId: bale.id, kategori: "kaos", kondisi: "baik", hasil: "layak" }, actor);
  await inventoryService.setGradePrice(raw.id, { grade: "A", harga: 100000 });
  return inventoryService.readyItem(raw.id, locationId, actor);
}

/** Close any lingering active session so tests that call openSession don't conflict */
async function closeActiveSessions() {
  const active = await db.liveSession.findMany({ where: { status: "berjalan" } });
  for (const s of active) {
    await db.liveSession.update({ where: { id: s.id }, data: { status: "selesai", selesai: new Date() } });
  }
}

/** Full flow: item → claim → order */
async function claimItem(item: { kode: string }, customerId: string, locationId: string, actor: { id: string; role: string }) {
  await closeActiveSessions();
  const session = await liveSellingService.openSession(`Sesi F6-${Date.now()}`);
  const result = await liveSellingService.inputClaim(session.id, {
    kodeProduk: item.kode,
    idPembeli: customerId,
    handle: "@user",
    waktuKomentar: new Date(),
  });
  await liveSellingService.closeSession(session.id);
  if (!result.idPesanan) throw new Error("Klaim gagal — tidak ada pesanan");
  return result.idPesanan;
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe("Fase 6: Payment & Fulfillment Orchestration (S12)", () => {
  let adminId: string;
  let locationId: string;
  let memberCustomerId: string;
  let nonMemberCustomerId: string;
  let actor: { id: string; role: string };

  // Per-describe shared state
  let memberOrderId: string;
  let memberInvoiceId: string;
  let memberPaymentId: string;
  let rejectOrderId: string;
  let rejectInvoiceId: string;

  beforeAll(async () => {
    await closeActiveSessions();
    const [admin, loc] = await Promise.all([
      db.appUser.findUniqueOrThrow({ where: { username: "admin" } }),
      db.location.findUniqueOrThrow({ where: { kode: "R01-S01" } }),
    ]);
    adminId = admin.id;
    locationId = loc.id;
    actor = admin;

    // Create test customers (unique handle per run with timestamp)
    const ts = Date.now();
    const member = await memberService.create({ nama: "Member F6", noWa: `0812${ts}01`, handleSosmed: `@member_f6_${ts}` });
    await memberService.update(member.id, { isMember: true });
    await memberService.addDeposit(member.id, 500000);
    memberCustomerId = member.id;

    const nonMember = await memberService.create({ nama: "NonMember F6", noWa: `0812${ts}02`, handleSosmed: `@nonmember_f6_${ts}` });
    nonMemberCustomerId = nonMember.id;
  });

  // ── Invoice creation ──────────────────────────────────────────────────────
  describe("Invoice", () => {
    it("creates invoice with member discount applied", async () => {
      const item = await createReadyItem(locationId, actor);
      memberOrderId = await claimItem(item, memberCustomerId, locationId, actor);

      const invoice = await fulfillmentService.createInvoice(memberOrderId, adminId);
      memberInvoiceId = invoice.id;

      expect(invoice.diskon).toBe(10000); // 10% of 100000
      expect(invoice.jumlah).toBe(90000);
      expect(invoice.status).toBe("belum dibayar");

      const notifs = await db.notificationLog.findMany({ where: { tipe: "invoiceCreated" } });
      expect(notifs.length).toBeGreaterThan(0);
    });

    it("creates invoice with no discount for non-member", async () => {
      const item = await createReadyItem(locationId, actor);
      const orderId = await claimItem(item, nonMemberCustomerId, locationId, actor);

      const invoice = await fulfillmentService.createInvoice(orderId, adminId);
      expect(invoice.diskon).toBe(0);
      expect(invoice.jumlah).toBe(100000);
    });

    it("rejects duplicate invoice for same order", async () => {
      await expect(fulfillmentService.createInvoice(memberOrderId, adminId)).rejects.toMatchObject({ status: 409 });
    });
  });

  // ── Payment recording ─────────────────────────────────────────────────────
  describe("Payment recording", () => {
    it("records a transfer payment as 'menunggu validasi'", async () => {
      const payment = await fulfillmentService.recordPayment(
        memberInvoiceId,
        { metode: "transfer", buktiBayar: "bukti-transfer-123.jpg", jumlah: 90000 },
        adminId,
      );
      memberPaymentId = payment.id;
      expect(payment.status).toBe("menunggu validasi");

      const log = await db.statusLog.findFirst({ where: { entitas: "Payment", entitasId: payment.id } });
      expect(log).not.toBeNull();
      expect(log!.keStatus).toBe("menunggu validasi");
    });
  });

  // ── Payment approval ──────────────────────────────────────────────────────
  describe("Payment approval (setuju)", () => {
    it("approves payment: payment lunas, invoice lunas, order lunas, item terjual, StockMovement recorded", async () => {
      await fulfillmentService.validatePayment(memberPaymentId, "setuju", undefined, adminId);

      const updatedPayment = await db.payment.findUniqueOrThrow({ where: { id: memberPaymentId } });
      expect(updatedPayment.status).toBe("lunas");

      const updatedInvoice = await db.invoice.findUniqueOrThrow({ where: { id: memberInvoiceId } });
      expect(updatedInvoice.status).toBe("lunas");

      const updatedOrder = await db.order.findUniqueOrThrow({ where: { id: memberOrderId } });
      expect(updatedOrder.status).toBe("lunas");

      const orderItems = await db.orderItem.findMany({ where: { orderId: memberOrderId } });
      for (const oi of orderItems) {
        const item = await db.item.findUniqueOrThrow({ where: { id: oi.itemId } });
        expect(item.status).toBe("terjual");
        expect(item.terjualPada).not.toBeNull();
      }

      const movement = await db.stockMovement.findFirst({ where: { nilaiBaru: "terjual", orderId: memberOrderId } });
      expect(movement).not.toBeNull();

      const payConfirmed = await db.notificationLog.findFirst({ where: { tipe: "payConfirmed" } });
      expect(payConfirmed).not.toBeNull();
    });
  });

  // ── Payment rejection ─────────────────────────────────────────────────────
  describe("Payment rejection (tolak)", () => {
    beforeAll(async () => {
      const item = await createReadyItem(locationId, actor);
      rejectOrderId = await claimItem(item, nonMemberCustomerId, locationId, actor);
      const invoice = await fulfillmentService.createInvoice(rejectOrderId, adminId);
      rejectInvoiceId = invoice.id;
    });

    it("rejects payment: payment ditolak, order stays menunggu pembayaran", async () => {
      const payment = await fulfillmentService.recordPayment(
        rejectInvoiceId,
        { metode: "transfer", buktiBayar: "bukti-tolak.jpg", jumlah: 100000 },
        adminId,
      );

      await fulfillmentService.validatePayment(payment.id, "tolak", "Bukti tidak valid", adminId);

      const rejectedPayment = await db.payment.findUniqueOrThrow({ where: { id: payment.id } });
      expect(rejectedPayment.status).toBe("ditolak");
      expect(rejectedPayment.alasanPenolakan).toBe("Bukti tidak valid");

      const orderAfter = await db.order.findUniqueOrThrow({ where: { id: rejectOrderId } });
      expect(orderAfter.status).toBe("menunggu pembayaran");
    });

    it("requires alasan when rejecting (400)", async () => {
      const payment = await fulfillmentService.recordPayment(
        rejectInvoiceId,
        { metode: "transfer", buktiBayar: "bukti2.jpg", jumlah: 100000 },
        adminId,
      );
      await expect(
        fulfillmentService.validatePayment(payment.id, "tolak", undefined, adminId),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  // ── Deposit payment ───────────────────────────────────────────────────────
  describe("Deposit payment", () => {
    it("approves deposit payment and deducts customer balance", async () => {
      const item = await createReadyItem(locationId, actor);
      const orderId = await claimItem(item, memberCustomerId, locationId, actor);
      const invoice = await fulfillmentService.createInvoice(orderId, adminId);

      const beforeBalance = (await memberService.memberStatus(memberCustomerId)).saldoDeposit;
      const payment = await fulfillmentService.recordPayment(
        invoice.id,
        { metode: "deposit", jumlah: invoice.jumlah },
        adminId,
      );

      await fulfillmentService.validatePayment(payment.id, "setuju", undefined, adminId);

      const afterBalance = (await memberService.memberStatus(memberCustomerId)).saldoDeposit;
      expect(afterBalance).toBe(beforeBalance - invoice.jumlah);
    });

    it("rejects deposit when saldo insufficient (409)", async () => {
      const item = await createReadyItem(locationId, actor);
      const orderId = await claimItem(item, nonMemberCustomerId, locationId, actor);
      const invoice = await fulfillmentService.createInvoice(orderId, adminId);

      // nonMember has 0 deposit → 409
      const payment = await fulfillmentService.recordPayment(
        invoice.id,
        { metode: "deposit", jumlah: invoice.jumlah },
        adminId,
      );
      await expect(
        fulfillmentService.validatePayment(payment.id, "setuju", undefined, adminId),
      ).rejects.toMatchObject({ status: 409 });

      const orderAfter = await db.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(orderAfter.status).toBe("menunggu pembayaran");
    });
  });

  // ── Order detail ──────────────────────────────────────────────────────────
  describe("GET /orders/:id full detail", () => {
    it("returns order with invoice, payment, packing, shipment fields", async () => {
      const detail = await fulfillmentService.orderDetail(memberOrderId);
      expect(detail.order.id).toBe(memberOrderId);
      expect(detail.invoice).not.toBeNull();
      expect(detail.invoice!.payments.length).toBeGreaterThan(0);
      // packing and shipment are null at this stage
      expect(detail.packing).toBeNull();
      expect(detail.shipment).toBeNull();
    });
  });
});
