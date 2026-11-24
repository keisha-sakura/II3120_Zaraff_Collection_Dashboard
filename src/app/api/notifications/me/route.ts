import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { notificationService } from "@backend/services/s7-notification/service";

export async function GET(request: Request) {
  try {
    const user = requireRole(request, ["pemilik", "admin", "penyortir", "host", "pengemas"]);
    // Filter by username as tujuan (staff notifications)
    return Response.json({ data: await notificationService.listForUser(user.username) });
  } catch (error) {
    return errorResponse(error);
  }
}
