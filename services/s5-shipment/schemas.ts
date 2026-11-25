import { z } from "zod";
export const shipmentStatusSchema = z
  .object({
    status: z.enum(["diserahkan", "dalam perjalanan", "diterima"]),
    catatan: z.string().trim().min(1).optional(),
  })
  .strict();
export const handoverSchema = z
  .object({ kurir: z.string().trim().min(1), noResi: z.string().trim().min(1) })
  .strict();
export const deliveryContractSchema = z
  .object({
    noResi: z.string().trim().min(1),
    status: shipmentStatusSchema.shape.status,
  })
  .strict();
