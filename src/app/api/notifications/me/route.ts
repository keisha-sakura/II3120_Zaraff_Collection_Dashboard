import { errorResponse } from "@backend/lib/errors";
import { requireRole } from "@backend/lib/requireRole";
import { notificationService } from "@backend/services/s7-notification/service";

export async function GET(request: Request) {
  try {
    const user = requireRole(request, [
      "pemilik",
      "admin",
      "penyortir",
      "host",
      "pengemas",
    ]);
    return Response.json({
      data: await notificationService.listForIdentity(user),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
