import {
  managementRoles,
  packingRoles,
  roles,
  warehouseRoles,
  type Role,
} from "./roles.ts";

export type ModuleId =
  | "beranda"
  | "gudang"
  | "penjualan"
  | "pembayaran"
  | "pengiriman"
  | "laporan"
  | "pengaturan"
  | "auth";
type PageSpec = readonly [
  id: string,
  title: string,
  path: string,
  module: ModuleId,
  roles: readonly Role[],
];

/** Planned routes. These definitions do not create implemented Next.js pages. */
const definitions = [
  ["M01", "Masuk", "/masuk", "auth", roles],
  ["B01", "Beranda Owner", "/beranda", "beranda", ["owner"]],
  ["B02", "Beranda Penyortir", "/beranda", "beranda", ["penyortir"]],
  ["B03", "Beranda Admin", "/beranda", "beranda", ["admin"]],
  ["B04", "Beranda Tim Packing", "/beranda", "beranda", ["packing"]],
  ["B05", "Beranda Live Host", "/beranda", "beranda", ["live-host"]],
  ["G01", "Bale dan Sortir", "/gudang/bale", "gudang", warehouseRoles],
  ["G02", "Terima bale", "/gudang/bale/baru", "gudang", warehouseRoles],
  ["G03", "Detail bale", "/gudang/bale/[baleId]", "gudang", warehouseRoles],
  [
    "G04",
    "Sortir item",
    "/gudang/bale/[baleId]/sortir",
    "gudang",
    warehouseRoles,
  ],
  [
    "G05",
    "Retur ke supplier",
    "/gudang/bale/[baleId]/sortir/retur",
    "gudang",
    warehouseRoles,
  ],
  ["G07", "Laundry", "/gudang/laundry", "gudang", warehouseRoles],
  [
    "G08",
    "Grading barang",
    "/gudang/laundry/[itemId]/grading",
    "gudang",
    warehouseRoles,
  ],
  ["G09", "Inventaris", "/gudang/inventaris", "gudang", warehouseRoles],
  [
    "G10",
    "Detail barang",
    "/gudang/inventaris/[itemId]",
    "gudang",
    warehouseRoles,
  ],
  [
    "P01",
    "Jadwal Live dan Promosi",
    "/penjualan/live",
    "penjualan",
    [...managementRoles, "live-host"],
  ],
  [
    "P02",
    "Konten dan jadwal live",
    "/penjualan/live/baru/konten",
    "penjualan",
    managementRoles,
  ],
  [
    "P03",
    "Pilih barang live",
    "/penjualan/live/baru/barang",
    "penjualan",
    managementRoles,
  ],
  [
    "P04",
    "Tinjau dan publikasikan live",
    "/penjualan/live/baru/publikasi",
    "penjualan",
    managementRoles,
  ],
  [
    "P05",
    "Impor klaim live",
    "/penjualan/live/[liveId]/klaim/impor",
    "penjualan",
    managementRoles,
  ],
  [
    "P06",
    "Hasil klaim live",
    "/penjualan/live/[liveId]/klaim",
    "penjualan",
    managementRoles,
  ],
  ["P07", "Pesanan", "/penjualan/pesanan", "penjualan", managementRoles],
  [
    "P08",
    "Detail pesanan",
    "/penjualan/pesanan/[orderId]",
    "penjualan",
    managementRoles,
  ],
  [
    "P09",
    "Pelanggan dan Member",
    "/penjualan/pelanggan",
    "penjualan",
    managementRoles,
  ],
  [
    "P10",
    "Detail pelanggan",
    "/penjualan/pelanggan/[customerId]",
    "penjualan",
    managementRoles,
  ],
  [
    "Y01",
    "Menunggu validasi",
    "/pembayaran/validasi",
    "pembayaran",
    managementRoles,
  ],
  [
    "Y02",
    "Validasi transfer",
    "/pembayaran/validasi/[paymentId]/transfer",
    "pembayaran",
    managementRoles,
  ],
  [
    "Y03",
    "Validasi deposit",
    "/pembayaran/validasi/[paymentId]/deposit",
    "pembayaran",
    managementRoles,
  ],
  [
    "Y05",
    "Belum dibayar",
    "/pembayaran/tagihan",
    "pembayaran",
    managementRoles,
  ],
  [
    "Y06",
    "Detail tagihan",
    "/pembayaran/tagihan/[invoiceId]",
    "pembayaran",
    managementRoles,
  ],
  ["D01", "Antrean Packing", "/pengiriman/packing", "pengiriman", packingRoles],
  [
    "D02",
    "Detail packing",
    "/pengiriman/packing/[orderId]",
    "pengiriman",
    packingRoles,
  ],
  [
    "D03",
    "Siap dikirim",
    "/pengiriman/siap-dikirim",
    "pengiriman",
    managementRoles,
  ],
  [
    "D04",
    "Input resi",
    "/pengiriman/siap-dikirim/[orderId]/resi",
    "pengiriman",
    managementRoles,
  ],
  [
    "D06",
    "Dalam pengiriman",
    "/pengiriman/dalam-pengiriman",
    "pengiriman",
    managementRoles,
  ],
  ["R01", "Ringkasan bisnis", "/laporan/ringkasan", "laporan", managementRoles],
  ["R02", "Laporan bulanan", "/laporan/bulanan", "laporan", managementRoles],
  [
    "R03",
    "Gudang dan umur stok",
    "/laporan/umur-stok",
    "laporan",
    managementRoles,
  ],
  [
    "R04",
    "Terjual dan keluar",
    "/laporan/terjual-keluar",
    "laporan",
    managementRoles,
  ],
  ["R05", "Strategi bulanan", "/laporan/strategi", "laporan", managementRoles],
  [
    "R06",
    "Tulis strategi",
    "/laporan/strategi/baru",
    "laporan",
    managementRoles,
  ],
  [
    "R07",
    "Kirim strategi",
    "/laporan/strategi/[strategyId]/kirim",
    "laporan",
    managementRoles,
  ],
  ["S01", "Aturan harga", "/pengaturan/harga", "pengaturan", managementRoles],
  ["S02", "Diskon member", "/pengaturan/diskon", "pengaturan", managementRoles],
  [
    "S03",
    "Lokasi penyimpanan",
    "/pengaturan/lokasi",
    "pengaturan",
    managementRoles,
  ],
] as const satisfies readonly PageSpec[];

export type PageId = (typeof definitions)[number][0];
export type PageDefinition = {
  id: PageId;
  title: string;
  path: string;
  module: ModuleId;
  roles: readonly Role[];
  public: boolean;
  designAvailable: boolean;
};
export const pages: readonly PageDefinition[] = definitions.map(
  ([id, title, path, module, allowedRoles]) => ({
    id,
    title,
    path,
    module,
    roles: allowedRoles,
    public: id === "M01",
    designAvailable: id !== "B05",
  }),
);
export function getPage(id: PageId): PageDefinition {
  return pages.find((page) => page.id === id)!;
}
export function getPagesForRole(role: Role) {
  return pages.filter((page) => !page.public && page.roles.includes(role));
}
export function canAccessPage(role: Role, id: PageId) {
  return getPage(id).roles.includes(role);
}

/** UI policy only. Real API/server authorization must use a verified session. */
export function canAccessPath(role: Role, pathname: string) {
  const segments = pathname.split("?")[0].split("/").filter(Boolean);
  return pages.some((page) => {
    const pattern = page.path.split("/").filter(Boolean);
    return (
      page.roles.includes(role) &&
      pattern.length === segments.length &&
      pattern.every(
        (part, index) => part.startsWith("[") || part === segments[index],
      )
    );
  });
}
