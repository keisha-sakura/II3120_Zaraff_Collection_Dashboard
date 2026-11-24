import { z } from "zod";

export const packQcSchema = z.object({
  kodeDitemukan: z.array(z.string().min(1)).min(1),
}).strict();
