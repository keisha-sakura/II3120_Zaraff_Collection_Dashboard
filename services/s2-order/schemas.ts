import { z } from "zod";

const date = z.coerce.date();

export const orderListSchema = z.object({
  status: z.string().optional(),
  tanggalDari: date.optional(),
  tanggalSampai: date.optional(),
});
