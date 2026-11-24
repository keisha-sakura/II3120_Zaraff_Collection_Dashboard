import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { liveSellingService } from "@backend/services/s10-live-selling/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(request, ["host", "admin"]);
    const { id } = await params;
    const csvText = await request.text();
    return Response.json({ data: await liveSellingService.importCsv(id, csvText) });
  } catch (error) {
    return errorResponse(error);
  }
}
