import { z } from "zod";
export const periodSchema = z
  .object({
    dari: z.coerce.date().optional(),
    sampai: z.coerce.date().optional(),
  })
  .strict()
  .refine(
    (input) => !input.dari || !input.sampai || input.dari <= input.sampai,
    { message: "Tanggal mulai harus sebelum tanggal akhir" },
  );
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const salesReportSchema = z
  .object({ bulan: monthSchema, format: z.enum(["json", "csv"]).optional() })
  .strict();
