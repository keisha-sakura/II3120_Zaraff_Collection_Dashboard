import { z } from "zod";

export const notifMeQuerySchema = z.object({
  tujuan: z.string().optional(),
});
