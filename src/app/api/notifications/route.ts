import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { notificationService } from "@backend/services/s7-notification/service";

export async function GET(request: Request) {
  try {
    requireRole(request, ["pemilik", "admin"]);
    return Response.json({ data: await notificationService.listAll() });
  } catch (error) {
    return errorResponse(error);
  }
}
