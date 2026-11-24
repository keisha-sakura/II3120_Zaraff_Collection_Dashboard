import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = new Date();

async function main() {
  await prisma.statusLog.deleteMany();
  await prisma.packingRecord.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.promotionItem.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockCountItem.deleteMany();
  await prisma.stockCountLocation.deleteMany();
  await prisma.stockCount.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.item.deleteMany();
  await prisma.bale.deleteMany();
  await prisma.location.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.discountRule.deleteMany();
  await prisma.strategy.deleteMany();
  await prisma.appUser.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.appUser.createMany({
    data: [
      ["pemilik", "pemilik"], ["admin", "admin"], ["penyortir", "penyortir"],
      ["host", "host"], ["pengemas", "pengemas"],
    ].map(([username, role]) => ({ username, role, passwordHash })),
  });
  const [r01s01, r01s02, r02s01] = await Promise.all(
    [["R01-S01", "Rak utama 1"], ["R01-S02", "Rak utama 2"], ["R02-S01", "Rak cadangan"]].map(
      ([kode, deskripsi]) => prisma.location.create({ data: { kode, deskripsi } }),
    ),
  );
  const bales = await Promise.all([
    prisma.bale.create({ data: { supplier: "Bandung Vintage", jenis: "campuran", beratKg: 50, jumlahItem: 15, tanggalTerima: now, status: "di gudang", locationId: r01s01.id } }),
    prisma.bale.create({ data: { supplier: "Solo Second", jenis: "fashion", beratKg: 45, jumlahItem: 15, tanggalTerima: now, status: "selesai disortir", locationId: r01s02.id } }),
  ]);
  const categories = ["kemeja", "kaos", "celana", "jaket", "dress"];
  const grades = ["A", "B", "C"];
  const items = Array.from({ length: 30 }, (_, index) => {
    const i = index + 1;
    const status = i <= 15 ? "tersedia" : i <= 20 ? "di laundry" : i <= 24 ? "diretur" : i === 25 ? "dipesan" : "tersedia";
    const available = status === "tersedia" || status === "dipesan";
    return {
      kode: `ZRF-${String(i).padStart(4, "0")}`,
      baleId: bales[index % 2].id,
      kategori: categories[index % categories.length],
      kondisi: index % 2 ? "baik" : "cukup",
      grade: status === "diretur" ? null : grades[index % grades.length],
      harga: status === "diretur" ? null : 50000 + (index % 3) * 25000,
      status,
      alasanRetur: status === "diretur" ? "Noda permanen" : null,
      locationId: available ? [r01s01, r01s02, r02s01][index % 3].id : null,
      laundrySejak: new Date(now.getTime() - (index + 1) * 86_400_000),
      tersediaSejak: available ? new Date(now.getTime() - (index + 1) * 86_400_000) : null,
    };
  });
  await prisma.item.createMany({ data: items });
  await prisma.customer.createMany({
    data: [
      { nama: "Ayu", noWa: "081200000001", handleSosmed: "@ayu", isMember: true, saldoDeposit: 200000 },
      { nama: "Bima", noWa: "081200000002", handleSosmed: "@bima", isMember: true, saldoDeposit: 0 },
      { nama: "Citra", noWa: "081200000003", handleSosmed: "@citra", isMember: false, saldoDeposit: 0 },
      { nama: "Deni", noWa: "081200000004", handleSosmed: "@deni", isMember: false, saldoDeposit: 0 },
      { nama: "Eka", noWa: "081200000005", handleSosmed: "@eka", isMember: false, saldoDeposit: 0 },
    ],
  });
  await prisma.pricingRule.createMany({
    data: categories.flatMap((kategori) => ["baik", "cukup"].flatMap((kondisi) =>
      grades.map((grade, i) => ({ kategori, kondisi, grade, harga: (grade === "A" ? 100000 : grade === "B" ? 75000 : 50000) - (kondisi === "cukup" ? 10000 : 0) + i * 0 })),
    )),
  });
  await prisma.discountRule.create({ data: { tipe: "member", persen: 10 } });
}

main().then(() => prisma.$disconnect()).catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
