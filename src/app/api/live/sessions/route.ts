import { errorResponse } from "@backend/lib/errors";
import { body } from "@backend/lib/route";
import { requireRole } from "@backend/lib/requireRole";
import { sessionCreateSchema } from "@backend/services/s10-live-selling/schemas";
import { liveSellingService } from "@backend/services/s10-live-selling/service";

export async function GET(request: Request) {
  try {
    requireRole(request, ["host", "admin", "pemilik"]);
    return Response.json({ data: await liveSellingService.listSessions() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireRole(request, ["host", "admin"]);
    const input = await body(request, sessionCreateSchema);
    return Response.json({ data: await liveSellingService.openSession(input.judul) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
