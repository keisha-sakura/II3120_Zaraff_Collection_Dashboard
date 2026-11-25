import { describe, expect, it } from "vitest";
import { db } from "../lib/db";
import { fulfillmentService } from "../services/s12-order-fulfillment/service";
import { memberService } from "../services/s3-member/service";
import { claimedOrder, request } from "./support/prototype";
import { POST as pay } from "../src/app/api/contracts/payment/pay/route";
import { POST as validate } from "../src/app/api/payments/[id]/validate/route";
import { GET as queue } from "../src/app/api/packing/queue/route";
import { POST as qc } from "../src/app/api/orders/[id]/quality-check/route";
import { POST as pack } from "../src/app/api/orders/[id]/pack/route";
import { POST as handover } from "../src/app/api/orders/[id]/handover/route";
import { POST as delivery } from "../src/app/api/contracts/delivery/status-update/route";
import { GET as tracking } from "../src/app/api/shipments/[orderId]/tracking/route";

describe("Fase 7: alur penuh dan kontrak publik", () => {
  it("klaim sampai selesai, QC wajib, lokasi tersedia, callback dan audit atomik", async () => {
    const f = await claimedOrder();
    const params = { params: Promise.resolve({ id: f.orderId }) };
    await expect(
      fulfillmentService.qualityCheck(f.orderId, [f.kode], f.adminId),
    ).rejects.toMatchObject({ status: 409 });
    const invoice = await fulfillmentService.createInvoice(
      f.orderId,
      f.adminId,
    );
    const payResponse = await pay(
      request(
        "contracts/payment/pay",
        "POST",
        { idTagihan: invoice.id, metode: "transfer", buktiBayar: "bukti.jpg" },
        undefined,
      ),
    );
    expect(payResponse.status).toBe(200);
    const payment = (await payResponse.json()).data as {
      id: string;
      status: string;
    };
    expect(payment.status).toBe("menunggu validasi");
    expect(
      await db.notificationLog.count({
        where: { tujuan: f.customerId, tipe: "payConfirmed" },
      }),
    ).toBe(0);
    expect(
      (
        await validate(
          request(
            "payments/validate",
            "POST",
            { keputusan: "setuju" },
            "admin",
          ),
          { params: Promise.resolve({ id: payment.id }) },
        )
      ).status,
    ).toBe(200);
    const queued = await queue(
      request("packing/queue", "GET", undefined, "pengemas"),
    );
    const queueBody = await queued.text();
    expect(queueBody).toContain(f.kode);
    expect(queueBody).toContain(f.locationId);
    expect(queueBody).not.toContain("noWa");
    expect(queueBody).not.toContain("buktiBayar");
    expect(
      (await pack(request("pack", "POST", undefined, "pengemas"), params))
        .status,
    ).toBe(409);
    const mismatch = await qc(
      request(
        "quality-check",
        "POST",
        { kodeDitemukan: [f.kode, f.kode] },
        "pengemas",
      ),
      params,
    );
    expect((await mismatch.json()).data.qcHasil).toBe("gagal");
    expect(
      (await pack(request("pack", "POST", undefined, "pengemas"), params))
        .status,
    ).toBe(409);
    expect(
      (
        await qc(
          request(
            "quality-check",
            "POST",
            { kodeDitemukan: [f.kode] },
            "pengemas",
          ),
          params,
        )
      ).status,
    ).toBe(200);
    expect(
      (await pack(request("pack", "POST", undefined, "pengemas"), params))
        .status,
    ).toBe(200);
    expect(
      (await db.item.findUniqueOrThrow({ where: { id: f.itemId } })).status,
    ).toBe("terjual");
    expect(
      (await fulfillmentService.packingQueue()).some(
        (entry) => entry.order.id === f.orderId,
      ),
    ).toBe(false);
    const noResi = `RESI-${f.orderId}`;
    expect(
      (
        await handover(
          request(
            "handover",
            "POST",
            { kurir: "Kurir simulasi", noResi },
            "admin",
          ),
          params,
        )
      ).status,
    ).toBe(200);
    expect(
      (await db.item.findUniqueOrThrow({ where: { id: f.itemId } })).status,
    ).toBe("keluar gudang");
    expect(
      (
        await delivery(
          request(
            "delivery",
            "POST",
            { noResi, status: "diterima" },
            undefined,
          ),
        )
      ).status,
    ).toBe(409);
    for (const status of ["dalam perjalanan", "diterima"])
      expect(
        (
          await delivery(
            request("delivery", "POST", { noResi, status }, undefined),
          )
        ).status,
      ).toBe(200);
    const detail = await fulfillmentService.orderDetail(f.orderId);
    expect(detail.order.status).toBe("selesai");
    expect(detail.shipment?.events.map((event) => event.status)).toEqual([
      "diserahkan",
      "dalam perjalanan",
      "diterima",
    ]);
    expect(
      (
        await tracking(request("tracking", "GET", undefined, "admin"), {
          params: Promise.resolve({ orderId: f.orderId }),
        })
      ).status,
    ).toBe(200);
    for (const entitas of ["Order", "Invoice", "Payment", "Shipment", "Claim"])
      expect(await db.statusLog.count({ where: { entitas } })).toBeGreaterThan(
        0,
      );
    const movements = await db.stockMovement.findMany({
      where: { objekId: f.itemId, tipe: "status" },
      orderBy: { waktu: "asc" },
    });
    expect(movements.map((movement) => movement.nilaiBaru)).toEqual([
      "di laundry",
      "tersedia",
      "dipesan",
      "terjual",
      "keluar gudang",
    ]);
    for (const tipe of [
      "claimResult",
      "payConfirmed",
      "packDone",
      "statusUpdate",
    ])
      expect(
        await db.notificationLog.count({
          where: { tipe, tujuan: f.customerId },
        }),
      ).toBeGreaterThan(0);
    await expect(
      fulfillmentService.pack(f.orderId, f.adminId),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      fulfillmentService.validatePayment(
        payment.id,
        "setuju",
        undefined,
        f.adminId,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("menolak nominal salah dan membatalkan semua perubahan bila deposit kurang", async () => {
    const f = await claimedOrder();
    const invoice = await fulfillmentService.createInvoice(
      f.orderId,
      f.adminId,
    );
    await expect(
      fulfillmentService.recordPayment(
        invoice.id,
        { metode: "deposit", jumlah: 1 },
        f.adminId,
      ),
    ).rejects.toMatchObject({ status: 409 });
    const payment = await fulfillmentService.recordPayment(
      invoice.id,
      { metode: "deposit" },
      f.adminId,
    );
    await expect(
      fulfillmentService.validatePayment(
        payment.id,
        "setuju",
        undefined,
        f.adminId,
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect(
      (await db.payment.findUniqueOrThrow({ where: { id: payment.id } }))
        .status,
    ).toBe("menunggu validasi");
    expect(
      (await db.invoice.findUniqueOrThrow({ where: { id: invoice.id } }))
        .status,
    ).toBe("belum dibayar");
    expect(
      (await db.item.findUniqueOrThrow({ where: { id: f.itemId } })).status,
    ).toBe("dipesan");
    expect((await memberService.memberStatus(f.customerId)).saldoDeposit).toBe(
      0,
    );
    expect(
      await db.notificationLog.count({
        where: { tipe: "payConfirmed", tujuan: f.customerId },
      }),
    ).toBe(0);
  });
  it("menegakkan RBAC dan mengembalikan 400 untuk kontrak invalid", async () => {
    expect(
      (await queue(request("packing/queue", "GET", undefined, undefined)))
        .status,
    ).toBe(401);
    expect(
      (await queue(request("packing/queue", "GET", undefined, "host"))).status,
    ).toBe(403);
    const params = { params: Promise.resolve({ id: "unknown" }) };
    expect(
      (
        await handover(
          request("handover", "POST", { kurir: "X", noResi: "Y" }, "pengemas"),
          params,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await qc(
          request("qc", "POST", { kodeDitemukan: [] }, "pengemas"),
          params,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await delivery(
          request(
            "delivery",
            "POST",
            { noResi: "X", status: "invalid" },
            undefined,
          ),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await pay(
          new Request("http://localhost/api/pay", {
            method: "POST",
            body: "{",
          }),
        )
      ).status,
    ).toBe(400);
  });
});
