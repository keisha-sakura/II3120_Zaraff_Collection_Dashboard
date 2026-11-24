import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { promotionUpdateSchema } from "@backend/services/s9-promotion/schemas";
import { promotionService } from "@backend/services/s9-promotion/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(request, ["admin", "pemilik"]);
    const { id } = await params;
    const input = await body(request, promotionUpdateSchema);
    return Response.json({ data: await promotionService.update(id, input) });
  } catch (error) {
    return errorResponse(error);
  }
}
