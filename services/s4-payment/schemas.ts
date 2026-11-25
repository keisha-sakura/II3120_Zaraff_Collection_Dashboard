import { z } from "zod";

export const recordPaymentSchema = z
  .object({
    metode: z.enum(["transfer", "deposit"]),
    buktiBayar: z.string().trim().min(1).optional(),
    jumlah: z.number().int().nonnegative().optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.metode === "transfer" && !v.buktiBayar)
      ctx.addIssue({
        code: "custom",
        path: ["buktiBayar"],
        message: "Bukti bayar wajib untuk metode transfer",
      });
  });

export const validatePaymentSchema = z
  .object({
    keputusan: z.enum(["setuju", "tolak"]),
    alasan: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.keputusan === "tolak" && !v.alasan)
      ctx.addIssue({
        code: "custom",
        path: ["alasan"],
        message: "Alasan wajib diisi saat menolak pembayaran",
      });
  });
