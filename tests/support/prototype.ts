import { randomUUID } from "node:crypto";
import { db } from "../../lib/db";
import { signToken, type Role } from "../../lib/auth";
import { inventoryService } from "../../services/s1-inventory/service";
import { memberService } from "../../services/s3-member/service";
import { liveSellingService } from "../../services/s10-live-selling/service";

export function request(
  path: string,
  method: string,
  input: unknown,
  role: Role | undefined,
): Request {
  const token = role
    ? signToken({ id: role, username: role, role })
    : undefined;
  return new Request(`http://localhost/api/${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(input === undefined ? {} : { body: JSON.stringify(input) }),
  });
}

export async function claimedOrder(): Promise<{
  orderId: string;
  itemId: string;
  kode: string;
  locationId: string;
  customerId: string;
  adminId: string;
}> {
  const admin = await db.appUser.findUniqueOrThrow({
    where: { username: "admin" },
  });
  const location = await db.location.findUniqueOrThrow({
    where: { kode: "R01-S01" },
  });
  const customer = await memberService.create({
    nama: "Integrasi",
    noWa: "081234567890",
    handleSosmed: `@test-${randomUUID()}`,
  });
  const bale = await inventoryService.createBale(
    {
      supplier: "Integrasi",
      jenis: "kaos",
      beratKg: 1,
      jumlahItem: 1,
      tanggalTerima: new Date(),
      locationId: location.id,
    },
    admin,
  );
  await inventoryService.startSorting(bale.id, admin);
  const item = await inventoryService.createItem(
    { baleId: bale.id, kategori: "kaos", kondisi: "baik", hasil: "layak" },
    admin,
  );
  await inventoryService.setGradePrice(item.id, { grade: "A", harga: 100000 });
  await inventoryService.readyItem(item.id, location.id, admin);
  for (const session of await liveSellingService.listSessions())
    if (session.status === "berjalan")
      await liveSellingService.closeSession(session.id);
  const session = await liveSellingService.openSession("Integrasi fulfillment");
  const claim = await liveSellingService.handleContractClaim({
    kodeProduk: item.kode,
    idPembeli: customer.id,
    handlePembeli: customer.handleSosmed,
    waktuKomentar: new Date(),
  });
  await liveSellingService.closeSession(session.id);
  if (!claim.idPesanan) throw new Error(`Klaim fixture gagal: ${claim.alasan}`);
  return {
    orderId: claim.idPesanan,
    itemId: item.id,
    kode: item.kode,
    locationId: location.id,
    customerId: customer.id,
    adminId: admin.id,
  };
}
