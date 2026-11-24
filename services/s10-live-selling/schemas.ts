import { z } from "zod";

export const sessionCreateSchema = z.object({
  judul: z.string().trim().min(1).max(200),
}).strict();

export const claimInputSchema = z.object({
  kodeProduk: z.string().trim().min(1),
  idPembeli: z.string().trim().min(1),
  handle: z.string().trim().min(1),
  waktuKomentar: z.coerce.date(),
}).strict();

export const liveClaimContractSchema = z.object({
  kodeProduk: z.string().trim().min(1),
  idPembeli: z.string().trim().min(1),
  handlePembeli: z.string().trim().min(1),
  waktuKomentar: z.coerce.date(),
}).strict();
