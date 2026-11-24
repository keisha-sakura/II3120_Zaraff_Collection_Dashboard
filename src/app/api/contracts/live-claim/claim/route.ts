import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { liveClaimContractSchema } from "@backend/services/s10-live-selling/schemas";
import { liveSellingService } from "@backend/services/s10-live-selling/service";

// Public endpoint — no JWT required. Always returns HTTP 200.
// 400 only if body schema fails.
export async function POST(request: Request) {
  try {
    const input = await body(request, liveClaimContractSchema);
    const result = await liveSellingService.handleContractClaim({
      kodeProduk: input.kodeProduk,
      idPembeli: input.idPembeli,
      handlePembeli: input.handlePembeli,
      waktuKomentar: input.waktuKomentar,
    });
    return Response.json({ data: result });
  } catch (error) {
    // Only return errorResponse (which may be 400 for zod) — business rejections are inside result
    return errorResponse(error);
  }
}
