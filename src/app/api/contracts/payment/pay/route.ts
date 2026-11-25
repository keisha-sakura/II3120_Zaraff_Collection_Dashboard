import { z } from "zod";
import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { fulfillmentService } from "@backend/services/s12-order-fulfillment/service";

const payContractSchema = z
  .object({
    idTagihan: z.string().min(1),
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

// Public payment contract — no JWT required.
export async function POST(request: Request) {
  try {
    const input = await body(request, payContractSchema);
    const data = await fulfillmentService.recordPayment(
      input.idTagihan,
      {
        metode: input.metode,
        buktiBayar: input.buktiBayar,
        jumlah: input.jumlah,
      },
      "contract",
    );
    return Response.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
