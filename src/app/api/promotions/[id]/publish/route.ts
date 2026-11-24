import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { promotionService } from "@backend/services/s9-promotion/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(request, ["admin", "pemilik"]);
    const { id } = await params;
    return Response.json({ data: await promotionService.publish(id) });
  } catch (error) {
    return errorResponse(error);
  }
}
