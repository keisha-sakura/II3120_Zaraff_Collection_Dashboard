import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { reportingService } from "@backend/services/s8-reporting/service";
export async function GET(request: Request): Promise<Response> {
  try {
    requireRole(request, ["pemilik"]);
    return Response.json({ data: await reportingService.stock() });
  } catch (error) {
    return errorResponse(error);
  }
}
