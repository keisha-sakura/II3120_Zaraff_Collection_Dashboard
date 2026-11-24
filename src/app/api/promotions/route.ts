import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { promotionCreateSchema } from "@backend/services/s9-promotion/schemas";
import { promotionService } from "@backend/services/s9-promotion/service";

export async function GET(request: Request) {
  try {
    requireRole(request, ["admin", "pemilik"]);
    return Response.json({ data: await promotionService.list() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireRole(request, ["admin", "pemilik"]);
    const input = await body(request, promotionCreateSchema);
    return Response.json({ data: await promotionService.create(input) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
