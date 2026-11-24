import { z } from "zod";

export const statusLogSchema = z.object({
  entitas: z.string().min(1),
  entitasId: z.string().min(1),
  dariStatus: z.string().nullable().optional(),
  keStatus: z.string().min(1),
  userId: z.string().min(1),
});
