import { z } from "zod";

export const customerCreateSchema = z.object({
  nama: z.string().trim().min(1).max(100),
  noWa: z.string().trim().min(8).max(20),
  handleSosmed: z.string().trim().min(1).max(60),
  isMember: z.boolean().optional(),
  saldoDeposit: z.number().int().nonnegative().optional(),
}).strict();

export const customerUpdateSchema = z.object({
  nama: z.string().trim().min(1).max(100).optional(),
  noWa: z.string().trim().min(8).max(20).optional(),
  handleSosmed: z.string().trim().min(1).max(60).optional(),
  isMember: z.boolean().optional(),
}).strict().refine((v) => Object.keys(v).length > 0, "Minimal satu field harus diisi");

export const depositSchema = z.object({
  jumlah: z.number().int().positive(),
}).strict();
