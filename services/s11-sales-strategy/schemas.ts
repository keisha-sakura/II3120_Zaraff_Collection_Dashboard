import { z } from "zod";
export const strategySchema = z
  .object({
    periode: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    isi: z.string().trim().min(1),
    penerimaUserIds: z.array(z.string().min(1)).min(1),
  })
  .strict();
