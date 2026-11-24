import { z } from "zod";

const date = z.coerce.date();
export const locationCreateSchema = z.object({ kode: z.string().trim().min(1).max(30), deskripsi: z.string().trim().min(1).max(200) }).strict();
export const locationUpdateSchema = locationCreateSchema.partial().refine((value) => Object.keys(value).length > 0);
export const baleCreateSchema = z.object({
  supplier: z.string().trim().min(1).max(100), jenis: z.string().trim().min(1).max(80), beratKg: z.number().positive(),
  jumlahItem: z.number().int().positive(), tanggalTerima: date, locationId: z.string().min(1),
}).strict();
export const itemCreateSchema = z.object({
  baleId: z.string().min(1), kategori: z.string().trim().min(1).max(80), kondisi: z.string().trim().min(1).max(80),
  hasil: z.enum(["layak", "retur"]), alasanRetur: z.string().trim().min(1).max(300).optional(),
}).strict().superRefine((value, context) => {
  if (value.hasil === "retur" && !value.alasanRetur) context.addIssue({ code: "custom", path: ["alasanRetur"], message: "Alasan retur wajib diisi" });
});
export const gradePriceSchema = z.object({ grade: z.enum(["A", "B", "C"]), harga: z.number().int().positive() }).strict();
export const readySchema = z.object({ locationId: z.string().min(1) }).strict();
export const itemListSchema = z.object({
  kode: z.string().optional(), kategori: z.string().optional(), grade: z.string().optional(), status: z.string().optional(), pencarian: z.string().optional(),
  halaman: z.coerce.number().int().positive().default(1), perHalaman: z.coerce.number().int().positive().max(100).default(25),
});
export const baleListSchema = z.object({ status: z.string().optional(), supplier: z.string().optional(), tanggalDari: date.optional(), tanggalSampai: date.optional() });
export const stockMoveSchema = z.object({ objekTipe: z.enum(["bale", "item"]), objekId: z.string().min(1), keLocationId: z.string().min(1) }).strict();
export const movementQuerySchema = z.object({ objekTipe: z.enum(["bale", "item"]).optional(), objekId: z.string().optional() });
export const stockCountCreateSchema = z.object({ locationIds: z.array(z.string().min(1)).min(1) }).strict();
export const stockCountItemSchema = z.object({ kodeItem: z.string().trim().min(1), locationId: z.string().min(1) }).strict();
export const warehousePeriodSchema = z.object({ dari: date.optional(), sampai: date.optional() });
