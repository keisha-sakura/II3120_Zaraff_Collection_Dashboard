import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { claimInputSchema } from "@backend/services/s10-live-selling/schemas";
import { liveSellingService } from "@backend/services/s10-live-selling/service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(request, ["host", "admin"]);
    const { id } = await params;
    return Response.json({ data: await liveSellingService.listClaims(id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(request, ["host", "admin"]);
    const { id } = await params;
    const input = await body(request, claimInputSchema);
    const result = await liveSellingService.inputClaim(id, {
      kodeProduk: input.kodeProduk,
      idPembeli: input.idPembeli,
      handle: input.handle,
      waktuKomentar: input.waktuKomentar,
    });
    return Response.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
