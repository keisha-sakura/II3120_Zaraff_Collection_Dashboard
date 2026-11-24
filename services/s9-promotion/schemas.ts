import { z } from "zod";

const date = z.coerce.date();

export const promotionCreateSchema = z.object({
  judul: z.string().trim().min(1).max(200),
  isi: z.string().trim().min(1),
  kanal: z.string().trim().min(1).max(80),
  jadwalLive: date,
  itemIds: z.array(z.string().min(1)).optional(),
}).strict();

export const promotionUpdateSchema = z.object({
  judul: z.string().trim().min(1).max(200).optional(),
  isi: z.string().trim().min(1).optional(),
  kanal: z.string().trim().min(1).max(80).optional(),
  jadwalLive: date.optional(),
}).strict().refine((v) => Object.keys(v).length > 0, "Minimal satu field harus diisi");
