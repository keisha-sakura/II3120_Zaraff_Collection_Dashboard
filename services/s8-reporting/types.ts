import type { Item, Location } from "@prisma/client";
export type Period = { dari?: Date; sampai?: Date };
export type StockReport = {
  total: number;
  perStatus: Record<string, number>;
  perGrade: Record<string, number>;
  items: (Item & { location: Location | null })[];
};
export type SalesReport = {
  bulan: string;
  jumlahItemTerjual: number;
  pendapatan: number;
  jumlahRetur: number;
  stokPerGrade: Record<string, number>;
  jumlahKeluarGudang: number;
  itemTerjual: Item[];
  keluarGudang: {
    kode: string;
    grade: string | null;
    hargaJual: number | null;
    tanggalTerjual: Date | null;
    tanggalKeluarGudang: Date | null;
    orderId: string | null;
  }[];
};
export type OverviewReport = {
  penjualan: number;
  pendapatan: number;
  stokTersedia: number;
  pesananAktif: number;
  pembayaranMenungguValidasi: number;
  pengirimanBerjalan: number;
};
