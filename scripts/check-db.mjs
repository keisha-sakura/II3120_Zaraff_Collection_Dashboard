import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const items = await p.item.findMany({
  where: { kode: { in: ["ZRF-0001", "ZRF-0002"] } },
  include: { location: true },
});
for (const item of items) {
  console.log(`${item.kode}: status=${item.status} locationId=${item.locationId} location=${item.location?.kode}`);
}
await p.$disconnect();
